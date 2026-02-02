// server.ts
import { Server } from "socket.io";

// 포트를 3000 -> 3005로 변경
const PORT = 3005;

// 지정된 포트로 소켓 서버 실행
const io = new Server(PORT, {
  cors: { origin: "*" },
});

// 중복 방지: 처리된 주문 ID 추적
const processedOrders = new Set<string>();

console.log(`Socket Server running on port ${PORT}`);

io.on("connection", (socket) => {
  console.log(`\n🔗 [Server] Client Connected: ${socket.id}`);

  // 주문 받기 (ACK 패턴)
  socket.on("order:create", (data, callback) => {
    const orderId = data.orderId || "UNKNOWN";
    const menuName = data.menu;

    console.log(`📥 [Server] [${orderId}] 주문 수신: "${menuName}"`);

    // 중복 체크: 이미 처리된 주문인지 확인
    if (processedOrders.has(orderId)) {
      console.log(
        `⏭️ [Server] [${orderId}] 중복 주문 감지 -> 이미 처리됨 (성공 응답 반환)`,
      );
      // 중복이지만 성공 응답 반환
      callback({ status: "ok", orderId: orderId, duplicate: true });
      return;
    }

    // 테스트용: 30% 확률로 서버가 응답 안 함 (네트워크 장애 시뮬레이션)
    if (Math.random() < 0.3) {
      console.log(
        `❌ [Server] [${orderId}] 시뮬레이션: 서버 무응답 (ACK 전송 안 함)`,
      );
      return; // 응답 안 보냄 -> 클라이언트는 재시도해야 함
    }

    // 정상 처리: 1초 뒤에 성공 응답 보냄
    setTimeout(() => {
      // 처리 완료된 주문으로 기록 (중복 방지)
      processedOrders.add(orderId);

      console.log(`✅ [Server] [${orderId}] 처리 완료 -> ACK 전송`);
      callback({ status: "ok", orderId: orderId });

      // // 메모리 관리: 1시간 후 삭제
      // setTimeout(() => {
      //   processedOrders.delete(orderId);
      //   console.log(`🗑️ [Server] [${orderId}] 처리 기록 삭제 (메모리 정리)`);
      // }, 3600000); // 1시간
    }, 1000);
  });

  socket.on("disconnect", () => {
    console.log(`\n❌ [Server] Client Disconnected: ${socket.id}`);
  });
});
