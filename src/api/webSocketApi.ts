import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { store } from '../store/store'; // Redux 스토어
import { updateChatRoom } from '../features/chatSlice';

// 1. STOMP 클라이언트 인스턴스를 앱 전체에서 공유하도록 하나만 생성
const stompClient = new Client({
  webSocketFactory: () => new SockJS('http://localhost:8081/api/ws'),
  // 연결 시도 간격을 5초로 설정
  reconnectDelay: 5000,
  // 통신이 없을 때 연결을 확인하는 heart-beat 설정
  heartbeatIncoming: 4000,
  heartbeatOutgoing: 4000,
  // 디버깅 메시지
  debug: (str) => {
    console.log(new Date(), str);
  },
});

// 연결 상태를 추적하는 변수
let isConnected = false;

// 연결을 시작하는 함수
export const connectWebSocket = () => {
  // 이미 연결되어 있다면 아무것도 하지 않음
  if (stompClient.connected || isConnected) {
    console.log('WebSocket is already connected.');
    return;
  }

  const accessToken = store.getState().auth.accessToken;
  if (!accessToken) {
    console.error('No access token found, WebSocket connection aborted.');
    return;
  }

  // STOMP 연결 헤더에 인증 토큰을 추가합니다.
  stompClient.configure({
    connectHeaders: {
      Authorization: `Bearer ${accessToken}`,
    },
    onConnect: () => {
      isConnected = true;
      console.log('WebSocket connection successful!');
      stompClient.subscribe('/user/queue/updates', (message) => {
        const updatedRoom = JSON.parse(message.body);
        store.dispatch(updateChatRoom(updatedRoom));
      });
    },
    onDisconnect: () => {
      isConnected = false;
      console.log('WebSocket disconnected.');
    },
    onStompError: (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    },
  });

  stompClient.activate();
};

// 연결을 끊는 함수
export const disconnectWebSocket = () => {
  if (stompClient.connected) {
    stompClient.deactivate();
  }
};

export default stompClient;