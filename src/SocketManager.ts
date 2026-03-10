import { io, Socket } from "socket.io-client";

interface QueueItem {
  id: string;
  data: any;
  retryCount: number; // 재시도 횟수 추적
}

export class SocketManager {
  private socket: Socket;
  private queue: QueueItem[] = [];
  public onStatusChange?: (isConnected: boolean) => void;
  public onOrderStatusChange?: (orderId: string, status: string) => void;
  private logCallback: (msg: string, type?: string) => void;
  private orderCounter = 0;
  private readonly MAX_RETRY_COUNT = 3;
  private readonly PROCESSED_ORDER_TTL = 5 * 60 * 1000; // 5분
  private processedOrders = new Set<string>();

  // removeEventListener 시 동일 참조가 필요하므로 인스턴스에 저장
  private handleOffline = () => {
    this.log("⚠️ 네트워크 오프라인 감지", "warning");
    this.onStatusChange?.(false);
  };

  private handleOnline = () => {
    this.log("🟢 네트워크 온라인 복구", "system");
  };

  constructor(url: string, logCallback: (msg: string, type?: string) => void) {
    this.logCallback = logCallback;
    this.socket = io(url, { reconnection: true });
    this.setupListeners();
  }

  private generateOrderId(): string {
    this.orderCounter++;
    return `ORD-${String(this.orderCounter).padStart(4, "0")}`;
  }

  private setupListeners() {
    this.socket.on("connect", () => {
      this.log("🟢 Socket 연결 성공", "system");
      this.onStatusChange?.(true);
      this.flushQueue(); // 재연결 시 큐 비우기
    });

    this.socket.on("disconnect", () => {
      this.log("🔴 Socket 연결 끊김", "system");
      this.onStatusChange?.(false);
    });

    // 네트워크 상태 감지 (터널, 비행기 모드 등)
    if (typeof window !== "undefined") {
      window.addEventListener("offline", this.handleOffline);
      window.addEventListener("online", this.handleOnline);
    }
  }

  // 주문 전송 (신뢰성 보장 로직)
  public sendOrder(orderData: any) {
    const id = this.generateOrderId();
    const menuName = orderData.menu;

    this.log(
      `📤 [${id}] 클라이언트 요청: "${menuName}" 주문 전송 중...`,
      "client"
    );
    this.onOrderStatusChange?.(id, "processing");

    // 1. 연결 안 됐거나 오프라인이면 바로 큐에 저장
    const isOffline =
      !this.socket.connected ||
      (typeof navigator !== "undefined" && !navigator.onLine);

    if (isOffline) {
      this.log(
        `⚠️ [${id}] 오프라인 상태 -> 큐에 저장 (재연결 시 자동 재시도)`,
        "warning"
      );
      this.queue.push({ 
        id, 
        data: { ...orderData, orderId: id },
        retryCount: 0 
      });
      this.onOrderStatusChange?.(id, "queued");
      return id;
    }

    // 2. 전송 및 ACK 대기
    let isAckReceived = false;

    this.socket.emit(
      "order:create",
      { ...orderData, orderId: id },
      (res: any) => {
        isAckReceived = true;
        if (res.status === "ok") {
          this.log(
            `📥 [${id}] 서버 응답: "${menuName}" 주문 처리 완료 ✅`,
            "server"
          );
          this.addProcessedOrder(id);
          this.onOrderStatusChange?.(id, "completed");
          this.removeFromQueue(id);
        }
      }
    );

    // 3. 타임아웃 처리 (서버 무응답 시)
    setTimeout(() => {
      if (!isAckReceived && !this.processedOrders.has(id)) {
        this.log(
          `⏱️ [${id}] 서버 무응답 (Timeout) -> 큐에 저장 후 재시도 예정`,
          "error"
        );
        this.queue.push({ 
          id, 
          data: { ...orderData, orderId: id },
          retryCount: 0 
        });
        this.onOrderStatusChange?.(id, "queued");
      }
    }, 2000); // 2초 대기

    return id;
  }

  // 큐 비우기 (재시도)
  private flushQueue() {
    if (this.queue.length === 0) return;

    this.log(
      `🔄 큐에 저장된 ${this.queue.length}개 주문 재전송 시작...`,
      "system"
    );
    const backup = [...this.queue];
    this.queue = [];

    backup.forEach((item) => {
      // 이미 처리된 주문은 스킵 (중복 방지)
      if (this.processedOrders.has(item.id)) {
        this.log(
          `⏭️ [${item.id}] 이미 처리된 주문 (스킵)`,
          "system"
        );
        return;
      }

      // 최대 재시도 횟수 초과 확인
      if (item.retryCount >= this.MAX_RETRY_COUNT) {
        this.log(
          `❌ [${item.id}] 최대 재시도 횟수(${this.MAX_RETRY_COUNT}회) 초과 -> 실패 처리`,
          "error"
        );
        this.onOrderStatusChange?.(item.id, "failed");
        return;
      }

      const menuName = item.data.menu;
      const retryNum = item.retryCount + 1;
      this.log(
        `🔁 [${item.id}] "${menuName}" ${retryNum}번째 재시도 중... (최대 ${this.MAX_RETRY_COUNT}회)`,
        "retry"
      );
      this.onOrderStatusChange?.(item.id, "retrying");

      // 재시도 카운트 증가
      item.retryCount++;

      let isAckReceived = false;
      this.socket.emit("order:create", item.data, (res: any) => {
        isAckReceived = true;
        if (res.status === "ok") {
          this.log(
            `📥 [${item.id}] 서버 응답: "${menuName}" 재시도 성공 ✅`,
            "server"
          );
          this.addProcessedOrder(item.id);
          this.onOrderStatusChange?.(item.id, "completed");
          this.removeFromQueue(item.id);
        }
      });

      setTimeout(() => {
        if (!isAckReceived && !this.processedOrders.has(item.id)) {
          this.log(
            `⏱️ [${item.id}] "${menuName}" ${retryNum}번째 재시도 실패`,
            "error"
          );
          
          // 아직 재시도 가능하면 큐에 다시 추가
          if (item.retryCount < this.MAX_RETRY_COUNT) {
            this.queue.push(item);
            this.onOrderStatusChange?.(item.id, "queued");
          } else {
            this.onOrderStatusChange?.(item.id, "failed");
          }
        }
      }, 2000);
    });
  }

  // 처리 완료 주문 기록 후 TTL 만료 시 자동 삭제
  private addProcessedOrder(orderId: string) {
    this.processedOrders.add(orderId);
    setTimeout(() => {
      this.processedOrders.delete(orderId);
    }, this.PROCESSED_ORDER_TTL);
  }

  // 큐에서 특정 주문 제거 (중복 방지 헬퍼 메서드)
  private removeFromQueue(orderId: string) {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter(item => item.id !== orderId);
    
    if (this.queue.length < initialLength) {
      this.log(`🗑️ [${orderId}] 큐에서 제거됨`, "system");
    }
  }

  private log(msg: string, type?: string) {
    console.log(msg);
    this.logCallback(msg, type);
  }

  // 테스트용: 연결 끊기
  public disconnect() {
    this.log("🔌 연결 수동 종료 (테스트)", "warning");
    this.socket.disconnect();
  }

  // 테스트용: 다시 연결
  public connect() {
    this.log("🔌 연결 재시도 중...", "system");
    this.socket.connect();
  }

  // 리소스 정리 (컴포넌트 unmount 시 호출)
  public destroy() {
    this.socket.off("connect");
    this.socket.off("disconnect");
    this.socket.disconnect();

    if (typeof window !== "undefined") {
      window.removeEventListener("offline", this.handleOffline);
      window.removeEventListener("online", this.handleOnline);
    }

    this.queue = [];
    this.onStatusChange = undefined;
    this.onOrderStatusChange = undefined;
    this.log("🧹 SocketManager 정리 완료", "system");
  }
}
