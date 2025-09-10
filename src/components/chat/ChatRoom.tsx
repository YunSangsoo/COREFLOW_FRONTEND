import React, { useEffect, useState, useRef } from 'react';
import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { ChatMessage, chatProfile, ChatRooms } from '../../types/chat';
import { store } from '../../store/store';
import { api } from '../../api/coreflowApi';

interface ChatRoomProps extends ChatRooms {
  myProfile: chatProfile;
}

const formatTime = (dateString: string | Date): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};
const isSameDay = (date1?: string | Date, date2?: string | Date): boolean => {
  if (!date1 || !date2) {
    return false;
  }
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

const formatDateSeparator = (dateString: string | Date): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
};


const ChatRoom = (props : ChatRoomProps) => {
  const { roomId, myProfile, partner } = props;
  // 채팅 메시지 목록을 저장할 state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // 입력창의 내용을 저장할 state
  const [newMessage, setNewMessage] = useState('');
  // STOMP 클라이언트 인스턴스를 저장할 ref
  const clientRef = useRef<Client | null>(null);
  // 메시지 목록 스크롤을 위한 ref
  const messageEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // 메시지 목록이 업데이트될 때마다 맨 아래로 스크롤
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  useEffect(() => {

    const fetchPreviousMessages = async () => {
      try {
        // 백엔드에 특정 채팅방의 메시지 목록을 요청하는 API (예시)
        await api.get<ChatMessage[]>(`/chatting/room/${roomId}/messages`).then(res => {
          setMessages(res.data);// 받아온 데이터로 메시지 목록 초기화
        })
        //setMessages(response.data); 
      } catch (error) {
        console.error("이전 대화 내역을 불러오는 데 실패했습니다:", error);
      }
    };
    // 함수 실행
    fetchPreviousMessages();

    // 1. localStorage에서 accessToken을 가져옵니다.
    const accessToken = store.getState().auth.accessToken;
    if (!accessToken) {
      console.error("Access Token이 없어 연결할 수 없습니다.");
      // 여기서 사용자에게 로그인 페이지로 이동하라는 등의 처리를 할 수 있습니다.
      return;
    }

    // 2. STOMP 클라이언트 생성
    const client = new Client({
      // 백엔드의 WebSocketConfig에 설정한 엔드포인트 주소
      // server.servlet.context-path가 있다면 반드시 포함해야 합니다.
      webSocketFactory: () => new SockJS('http://localhost:8081/api/ws'),

      // STOMP 연결 시 인증 헤더를 추가합니다.
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },

      // 연결 성공 시 실행될 콜백
      onConnect: () => {
        console.log(`STOMP 서버에 연결되었습니다. (방 번호: ${roomId})`);

        // 3. 채팅방 구독 (서버로부터 메시지를 받기 시작)
        client.subscribe(`/topic/room/${roomId}`, (message: IMessage) => {
          const receivedMessage: ChatMessage = JSON.parse(message.body);
          setMessages(prevMessages => [...prevMessages, receivedMessage]);
        });

        // 4. 입장 메시지 전송 (서버로 메시지 발행)
        client.publish({
          destination: `/app/chat/enter/${roomId}`,
          body: JSON.stringify({
            userNo : myProfile.userNo,
            userName : myProfile.userName,
            roomId:roomId,
            messageText: '',
          }),
        });
      },

      // 연결 끊김 시 콜백
      onDisconnect: () => {
        console.log('STOMP 연결이 끊어졌습니다.');
      },

      // STOMP 프로토콜 오류 발생 시 콜백
      onStompError: (frame) => {
        console.error('STOMP 프로토콜 오류:', frame.headers['message']);
        console.error('오류 상세:', frame.body);
      },

      // 디버깅 메시지 출력
      debug: (str) => {
        console.log(new Date(), str);
      },
    });

    // 5. STOMP 연결 활성화
    client.activate();
    clientRef.current = client;

    // 6. 컴포넌트가 언마운트될 때 연결을 해제합니다. (자원 누수 방지)
    return () => {
      if (client.connected) {
        // 퇴장 메시지 전송
        client.publish({
          destination: `/app/chat/exit/${roomId}`,
          body: JSON.stringify({
            userNo : myProfile.userNo,
            userName : myProfile.userName,
            roomId:roomId,
            messageText: '',
          }),
        });
        client.deactivate();
      }
    };
  }, [roomId, myProfile,partner]); // 방이나 유저가 바뀌면 연결을 다시 설정

  // 메시지 전송 함수
  const sendMessage = () => {
    if (newMessage.trim() && clientRef.current?.connected) {
      clientRef.current.publish({
        destination: `/app/chat/message/${roomId}`, // 메시지 전송용 엔드포인트
        body: JSON.stringify({
          roomId:roomId,
          messageText: newMessage,
          type: 'TALK',
        }),
      });
      setNewMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => {
          const prevMsg = messages[index - 1];
          const showDateSeparator = !isSameDay(prevMsg?.sentAt, msg.sentAt);

          return (
            <React.Fragment key={index}>
              {/* 📅 날짜 구분선 */}
              {showDateSeparator && (
                <div className="text-center my-4">
                  <span className="bg-gray-200 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full">
                    {formatDateSeparator(msg.sentAt)}
                  </span>
                </div>
              )}

              {/* 메시지 본문 */}
              <div className={`flex items-end space-x-2 ${msg.userNo === myProfile.userNo ? 'justify-end' : 'justify-start'}`}>
                {msg.type !== 'TALK' ? (
                  <div className="text-center text-xs text-gray-500 w-full py-1">
                    <p>{msg.messageText}</p>
                  </div>
                ) : msg.userNo === myProfile.userNo ? (
                  <div className="flex items-end space-x-2">
                    {/* 시간 표시 */}
                    <span className="text-xs text-gray-400 mb-1 flex-shrink-0">{formatTime(msg.sentAt)}</span>
                    <div className="bg-blue-500 text-white p-3 rounded-lg max-w-xs">
                      <p className="break-all">{msg.messageText}</p>
                    </div>
                  </div>
                ) : (
                  // 상대방이 보낸 메시지
                  <div className="flex items-end space-x-2">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-semibold">{msg.userName}</p>
                      <div className="flex items-end space-x-2">
                        <div className="bg-gray-200 text-gray-800 p-3 rounded-lg max-w-xs">
                          <p className="break-all">{msg.messageText}</p>
                        </div>
                        {/* 시간 표시 */}
                        <span className="text-xs text-gray-400 mb-1 flex-shrink-0">{formatTime(msg.sentAt)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
        {/* 스크롤을 맨 아래로 이동시키기 위한 빈 div */}
        <div ref={messageEndRef} />
      </div>

      {/* 메시지 입력창 */}
      <div className="p-2 border-t flex">
        <input 
          type="text" 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="메시지를 입력하세요..."
          className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button 
          onClick={sendMessage}
          className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          전송
        </button>
      </div>
    </div>
  );
};

export default ChatRoom;