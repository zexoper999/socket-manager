import { io, Socket } from "socket.io-client";

interface QueueItem {
  id: string;
  data: any;
}

export class SocketManager {
  private socket: Socket;
  private queue: QueueItem[] = [];
  public onStatusChange?: (isConnected: boolean) => void;
  private logCallback: (msg: string) => void;

  constructor(url: string, logCallback: (msg: string) => void) {
    this.logCallback = logCallback;
    this.socket = io(url, { reconnection: true });
    this.setupListeners();
  }

  private setupListeners() {
    this.socket.on("connect", () => {
      this.log("[Socket Connected]");
      this.onStatusChange?.(true);
      this.flushQueue(); // 재연결 시 큐 비우기
    });

    this.socket.on("disconnect", () => {
      this.log("[Socket Disconnected]");
      this.onStatusChange?.(false);
    });
  }

  // 주문 전송 (신뢰성 보장 로직)
  public sendOrder(orderData: any) {
    const id = Math.random().toString().slice(2, 8);
    this.log(`[Sending Order #${id}...]`);

    // 1. 연결 안 됐으면 바로 큐에 저장
    if (!this.socket.connected) {
      this.log(`[Offline -> Saved to Queue (#${id})]`);
      this.queue.push({ id, data: orderData });
      return;
    }

    // 2. 전송 및 ACK 대기
    let isAckReceived = false;

    this.socket.emit("order:create", { ...orderData, id }, (res: any) => {
      isAckReceived = true;
      if (res.status === "ok") {
        this.log(`[Success (#${id})]`);
      }
    });

    // 3. 타임아웃 처리 (서버 무응답 시)
    setTimeout(() => {
      if (!isAckReceived) {
        this.log(`[Timeout -> Retrying later (#${id})]`);
        this.queue.push({ id, data: orderData });
      }
    }, 2000); // 2초 대기
  }

  // 큐 비우기 (재시도)
  private flushQueue() {
    if (this.queue.length === 0) return;

    this.log(`[Flushing Queue (${this.queue.length} items)...]`);
    const backup = [...this.queue];
    this.queue = [];

    backup.forEach((item) => {
      this.log(`[Retrying Order #${item.id}]`);
      this.sendOrder(item.data);
    });
  }

  private log(msg: string) {
    console.log(msg);
    this.logCallback(msg);
  }
}
