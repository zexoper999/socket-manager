# 🔄 Real-Time Order System with Reliability

> 네트워크 단절/서버 무응답 상황에서도 주문 유실을 방지하기 위해, ACK+Timeout+Queue 기반의 신뢰성 레이어를 구현한 실시간 주문 시스템

![Image](https://github.com/user-attachments/assets/2517399a-a997-4bad-8dd7-352d7b4edd3b)

> 실시간 주문 전송, 네트워크 장애 시뮬레이션, 자동 재시도 과정

---

## 🎯 문제 정의

**네트워크 불안정 및 웹뷰 백그라운드 전환 시 주문 누락 발생**

- 매장 와이파이 신호 약함, 터널과 같은 네트워크 차단 환경에서 순간적인 연결 끊김
- 모바일 웹뷰 백그라운드 전환 시 Socket 연결 해제
- 서버 무응답 시 주문 데이터 손실

### 해결 방법

| 상황          | 기존 시스템         | 개선된 시스템  |
| ------------- | ------------------- | -------------- |
| 네트워크 끊김 | ❌ 주문 손실        | ✅ 큐에 저장   |
| 서버 무응답   | ❌ 타임아웃만 발생  | ✅ 자동 재시도 |
| 재연결 후     | ❌ 수동 재주문 필요 | ✅ 자동 전송   |

---

## ✨ 핵심 기능

**1. 다층 방어 네트워크 감지**

```
주문 시도
  ↓
1차: Socket 연결 상태 체크 (socket.connected)
2차: 브라우저 네트워크 상태 체크 (navigator.onLine)
3차: ACK Timeout 감지 (2초)
  ↓
오프라인 → 큐에 저장 → 재연결 시 자동 재시도
```

**2. 실시간 주문 상태 추적**

- `processing` → `completed` (정상)
- `processing` → `queued` → `retrying` → `completed` (장애 복구)
- `processing` → `queued` → `failed` (재시도 실패)

**3. 상세 로그 시스템**

- 클라이언트 요청/서버 응답 구분
- 주문 ID 기반 추적

---

## 🛠 기술 스택

**Frontend**: Vue 3 (Composition API), TypeScript, SCSS  
**Backend**: Node.js, Socket.IO  
**Build**: Vite

---

## 🚀 실행 방법

```bash
# 의존성 설치
npm install

# 서버 실행
npm run server

# 클라이언트 실행
npm run dev
```

### 테스트 방법

1. **정상 시나리오**: 주문 → 서버 응답 → 완료
2. **네트워크 장애**: "연결 끊기" → 주문 → "재연결" → 자동 재시도
3. **서버 무응답**: 주문 → 2초 Timeout → 큐 저장 → 재시도

---

## 💡 핵심 구현

![Image](https://github.com/user-attachments/assets/ba66a792-ae9b-4960-a193-c2fc0af6b009)

### SocketManager 클래스

**신뢰성 있는 주문 전송 (3단계 방어)**

```typescript
public sendOrder(orderData: any) {
  const id = this.generateOrderId();

  // 1차 방어: Socket + 브라우저 네트워크 상태 체크
  const isOffline = !this.socket.connected || !navigator.onLine;
  if (isOffline) {
    this.queue.push({ id, data: orderData });
    return id;
  }

  // 2차 방어: ACK 패턴
  let isAckReceived = false;
  this.socket.emit("order:create", orderData, (res) => {
    isAckReceived = true;
  });

  // 3차 방어: Timeout (2초)
  setTimeout(() => {
    if (!isAckReceived) {
      this.queue.push({ id, data: orderData }); // 큐 저장
    }
  }, 2000);
}
```

**자동 재시도**

```typescript
private setupListeners() {
  this.socket.on("connect", () => {
    this.flushQueue(); // 재연결 시 큐의 모든 주문 재전송
  });
}
```

**실시간 상태 업데이트**

```typescript
socketManager.onOrderStatusChange = (orderId, status) => {
  const order = orders.find((o) => o.id === orderId);
  if (order) order.status = status;
};
```

---
