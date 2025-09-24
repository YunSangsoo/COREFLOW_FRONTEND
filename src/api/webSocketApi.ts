import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { store } from '../store/store'; // Redux 스토어
import { updateChatRoom } from '../features/chatSlice';
import type { chatProfile, SignalType } from '../types/chat';

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
  },
});

// 연결 상태를 추적하는 변수
let isConnected = false;

// 연결을 시작하는 함수
export const connectWebSocket = () => {
  // 이미 연결되어 있다면 아무것도 하지 않음
  if (stompClient.connected || isConnected) {
    return;
  }

  const accessToken = store.getState().auth.accessToken;
  if (!accessToken) {
    return;
  }

  // STOMP 연결 헤더에 인증 토큰을 추가합니다.
  stompClient.configure({
    connectHeaders: {
      Authorization: `Bearer ${accessToken}`,
    },
    onConnect: () => {
      isConnected = true;
      stompClient.subscribe('/user/queue/updates', (message) => {
        const updatedRoom = JSON.parse(message.body);
        store.dispatch(updateChatRoom(updatedRoom));
      });
    },
    onDisconnect: () => {
      isConnected = false;
    },
    onStompError: (frame) => {
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


export const sendSignal = (
  type: SignalType, 
  data: any, 
  fromUser: chatProfile, 
  toUser: chatProfile
) => {
  if (!stompClient.connected) {
    console.error("STOMP client is not connected.");
    return;
  }
  stompClient.publish({
    destination: '/app/webrtc/signal',
    body: JSON.stringify({
      type,
      from: fromUser.userNo,
      to: toUser.userNo,
      data,
    }),
  });
};

export default stompClient;