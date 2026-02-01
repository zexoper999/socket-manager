// server.ts
import { Server } from "socket.io";

// 포트를 3000 -> 3005로 변경
const PORT = 3005;

// 지정된 포트로 소켓 서버 실행
const io = new Server(PORT, {
  cors: { origin: "*" },
});

console.log(`Socket Server running on port ${PORT}`);

io.on("connection", (socket) => {
  console.log(`[Server] Client Connected: ${socket.id}`);

  // 주문 받기 (ACK 패턴)
  socket.on("order:create", (data, callback) => {
    const orderId = data.orderId || "UNKNOWN";
    const menuName = data.menu;

    console.log(`[Server] [${orderId}] 주문 수신: "${menuName}"`);

    // 테스트용: 30% 확률로 서버가 응답 안 함 (네트워크 장애 시뮬레이션)
    if (Math.random() < 0.3) {
      console.log(
        `[Server] [${orderId}] 시뮬레이션: 서버 무응답 (ACK 전송 안 함)`,
      );
      return; // 응답 안 보냄 -> 클라이언트는 재시도해야 함
    }

    // 정상 처리: 1초 뒤에 성공 응답 보냄
    setTimeout(() => {
      console.log(`[Server] [${orderId}] 처리 완료 -> ACK 전송`);
      callback({ status: "ok", orderId: orderId });
    }, 1000);
  });

  socket.on("disconnect", () => {
    console.log(`[Server] Client Disconnected: ${socket.id}`);
  });
});
