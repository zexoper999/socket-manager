import { createApp, ref } from "vue";
import { SocketManager } from "./SocketManager";

const app = createApp({
  setup() {
    const isConnected = ref(false);
    const logs = ref<string[]>([]);

    // 소켓 매니저 초기화 (로그를 화면에 찍기 위해 콜백 함수 전달)
    const socketManager = new SocketManager("http://localhost:3005", (msg) => {
      const time = new Date().toLocaleTimeString();
      logs.value.unshift(`[${time}] ${msg}`);
    });

    // 연결 상태 감지
    socketManager.onStatusChange = (status) => {
      isConnected.value = status;
    };

    const sendOrder = () => {
      socketManager.sendOrder({ menu: "Ice Americano" });
    };

    const clearLogs = () => (logs.value = []);

    return { isConnected, logs, sendOrder, clearLogs };
  },
});

app.mount("#app");
