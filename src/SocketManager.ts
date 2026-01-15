import { io, Socket } from "socket.io-client";

interface QueueItem {
  id: string;
  data: any;
}

export class SocketManager {
  private socket: Socket;
  private queue: QueueItem[] = [];
  public onStatusChange?: (isConnected: boolean) => void;
  public onOrderStatusChange?: (orderId: string, status: string) => void;
  private logCallback: (msg: string, type?: string) => void;
  private orderCounter = 0;

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

    // 1. 연결 안 됐으면 바로 큐에 저장
    if (!this.socket.connected) {
      this.log(
        `⚠️ [${id}] 오프라인 상태 -> 큐에 저장 (재연결 시 자동 재시도)`,
        "warning"
      );
      this.queue.push({ id, data: { ...orderData, orderId: id } });
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
          this.onOrderStatusChange?.(id, "completed");
        }
      }
    );

    // 3. 타임아웃 처리 (서버 무응답 시)
    setTimeout(() => {
      if (!isAckReceived) {
        this.log(
          `⏱️ [${id}] 서버 무응답 (Timeout) -> 큐에 저장 후 재시도 예정`,
          "error"
        );
        this.queue.push({ id, data: { ...orderData, orderId: id } });
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
      const menuName = item.data.menu;
      this.log(`🔁 [${item.id}] "${menuName}" 재시도 중...`, "retry");
      this.onOrderStatusChange?.(item.id, "retrying");

      // 재시도 시에는 새로운 ID를 생성하지 않고 기존 ID 유지
      let isAckReceived = false;
      this.socket.emit("order:create", item.data, (res: any) => {
        isAckReceived = true;
        if (res.status === "ok") {
          this.log(
            `📥 [${item.id}] 서버 응답: "${menuName}" 재시도 성공 ✅`,
            "server"
          );
          this.onOrderStatusChange?.(item.id, "completed");
        }
      });

      setTimeout(() => {
        if (!isAckReceived) {
          this.log(
            `❌ [${item.id}] "${menuName}" 재시도 실패 (큐에 재저장)`,
            "error"
          );
          this.queue.push(item); // 다시 큐에 저장
          this.onOrderStatusChange?.(item.id, "failed");
        }
      }, 2000);
    });
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
}
