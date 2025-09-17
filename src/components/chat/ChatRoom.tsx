import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Client, type IMessage } from '@stomp/stompjs';
import type { ChatMessage, chatProfile, ChatRooms, ModalState } from '../../types/chat';
import { api } from '../../api/coreflowApi';
import stompClient from '../../api/webSocketApi';
import { ChatRoomModal } from './UserActionModal';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import SettingsIcon from './SvgSettingIcon';

interface ChatRoomProps extends ChatRooms {
  myProfile: chatProfile;
  onNewMessage: (room: ChatRooms, message: ChatMessage) => void;
  onRoomUserList: (roomId:number, users:chatProfile[]) => void;
  onOpenProfile: (user:chatProfile)=>void;
  onOpenFileUpload: (chatRoom: ChatRooms) => void;
  onLeaveRoom: (roomId : number) => void;
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

const markAsRead = (roomId:Number) => {
  api.post(`/chatting/room/${roomId}/read`)
      .catch(err => console.error("'읽음' 처리 실패:", err));
};

const ChatRoom = (props : ChatRoomProps) => {
  const { roomId, myProfile, partner, onNewMessage, onRoomUserList,onOpenProfile, onOpenFileUpload, onLeaveRoom } = props;
  
  // 채팅 메시지 목록을 저장할 state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // 입력창의 내용을 저장할 state
  const [newMessage, setNewMessage] = useState('');
  // 메시지 목록 스크롤을 위한 ref
  const [users,setUsers] = useState<chatProfile[]>([]);

  const [roomConfig, setRoomConfig] = useState<ModalState>({
      isOpen: false,
      user: null,
      position: { top: 0, left: 0 },
    });

  const thisChatRoom = useSelector((state: RootState) => state.chat.chatRooms).find(chatRoom=>chatRoom.roomId === roomId);

  const userProfileMap = useMemo(() => {
    return new Map(users.map(user => [user.userNo, user]));
  }, [users]);

  const messageEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // 메시지 목록이 업데이트될 때마다 맨 아래로 스크롤
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  useEffect(() => {

    api.get(`/chatting/room/${roomId}/user`).then(res=>{
      setUsers(res.data);
    });

    const fetchPreviousMessages = async () => {
      try {
        // 백엔드에 특정 채팅방의 메시지 목록을 요청하는 API
        await api.get<ChatMessage[]>(`/chatting/room/${roomId}/messages`).then(res => {
          setMessages(res.data);// 받아온 데이터로 메시지 목록 초기화
        })
      } catch (error) {
        alert("이전 대화 내역을 불러오는 데 실패했습니다");
      }
    };
    // 함수 실행
    fetchPreviousMessages();

    if (stompClient.connected&& roomId) {
      markAsRead(roomId);
      // 1. 특정 채팅방 토픽 구독
      const subscription = stompClient.subscribe(`/topic/room/${roomId}`, (message: IMessage) => {
        const receivedMessage: ChatMessage = JSON.parse(message.body);
        setMessages(prev => [...prev, receivedMessage]);
        const { onNewMessage, ...roomData } = props;
        onNewMessage({ ...roomData, unreadCount: 0 }, receivedMessage);
      });
      


      // 2. 입장 메시지 발행
      stompClient.publish({
          destination: `/app/chat/enter/${roomId}`,
          body: JSON.stringify({
            userNo : myProfile.userNo,
            userName : myProfile.userName,
            roomId:roomId,
            sentAt: new Date(),
            messageText: '',
            type: 'ENTER',
          }),
        });
      
      // 3. 컴포넌트가 사라질 때 구독을 해제하고 퇴장 메시지를 보냄
      return () => {
        stompClient.publish({
          destination: `/app/chat/exit/${roomId}`,
          body: JSON.stringify({
            userNo : myProfile.userNo,
            userName : myProfile.userName,
            roomId:roomId,
            sentAt: new Date(),
            messageText: '',
            type: 'EXIT',
          }),
        });
        subscription.unsubscribe();
        markAsRead(roomId);
      };
    }
  }, [roomId, myProfile?.userNo]); // 방이나 유저가 바뀌면 연결을 다시 설정

  // 메시지 전송 함수
  const sendMessage = () => {
    if (newMessage.trim() && stompClient?.connected) {
      stompClient?.publish({
        destination: `/app/chat/message/${roomId}`, // 메시지 전송용 엔드포인트
        body: JSON.stringify({
          roomId:roomId,
          userName : myProfile.userName,
          messageText: newMessage,
          sentAt: new Date(),
          type: 'TALK',
        }),
      });
      setNewMessage('');
      markAsRead(roomId);
    }
  };

  const handleOpenConfig = (event: React.MouseEvent<HTMLButtonElement>) =>{
      event.preventDefault();
      event.stopPropagation();
      const rect = event.currentTarget.getBoundingClientRect();
      setRoomConfig({
        isOpen: true,
        user: null,
        position: {
          top: rect.bottom + 8,
          left: rect.left - (rect.width / 2),
        },
      });
    }

  const handlecloseSetModal = () => {
    setRoomConfig({ isOpen: false, user: null, position: { top: 0, left: 0 } });
  };

  const handleRoomUserList = () =>{
    onRoomUserList(roomId,users);
  }
  return (
    <>
      <button className="absolute bg-indigo-300 hover:bg-indigo-600 text-indigo-700 hover:text-white"
      onClick={handleOpenConfig}>
        <SettingsIcon size={15} />
      </button>
      <div className="flex flex-col h-full">
        {/* 메시지 목록 */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">

          {messages.map((msg, index) => {
            const prevMsg = messages[index - 1];
            const showDateSeparator = !isSameDay(prevMsg?.sentAt, msg.sentAt);
            const senderProfile = userProfileMap.get(msg.userNo);

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
                  {msg.type === 'ENTER' || msg.type==='EXIT' ? (
                    <div className="text-center text-xs text-gray-500 w-full py-1">
                      <p>{msg.messageText}</p>
                    </div>
                  ) : msg.userNo === myProfile.userNo ? (
                    <div className="flex items-end space-x-2">
                      {/* 시간 표시 */}
                      <span className="text-xs text-gray-400 mb-1 flex-shrink-0">{formatTime(msg.sentAt)}</span>
                      <div className="bg-blue-500 text-white p-3 rounded-lg max-w-xs">
                        {msg.type==='FILE'&& msg.file?
                        (msg.file.mimeType.startsWith('image/') ? (
                            <a href={`${import.meta.env.VITE_API_BASE_URL}/download/${msg.file.imageCode}/${msg.file.changeName}`} target="_blank" rel="noopener noreferrer">
                              <img 
                                src={`${import.meta.env.VITE_API_BASE_URL}/images/${msg.file.imageCode}/${msg.file.changeName}`}
                                alt={msg.file.originName}
                                className="w-full h-auto max-h-64 rounded-lg object-cover cursor-pointer"/>
                            </a>
                          ) : (
                            <a 
                              href={`${import.meta.env.VITE_API_BASE_URL}/download/${msg.file.imageCode}/${msg.file.changeName}`} 
                              download={msg.file.originName || "download"}
                              className={`flex items-center space-x-2 p-3 rounded-lg max-w-xs cursor-pointer
                                      ${myProfile.userNo ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
                            >
                              {/* 파일 아이콘 */}
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 flex-shrink-0">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                              </svg>
                              <span className="break-all">{msg.file.originName}</span>
                            </a>
                          )
                        )
                        :(<p className="break-all">{msg.messageText}</p>)}
                      </div>
                    </div>
                  ) : (
                    // 상대방이 보낸 메시지
                    <div className="flex items-end space-x-2">
                      {senderProfile ? (
                        <img
                          onClick={()=>onOpenProfile(senderProfile)}
                          src={`${import.meta.env.VITE_API_BASE_URL}/images/${senderProfile.profile.imageCode}/${senderProfile.profile.changeName}`}
                          alt={senderProfile.userName}
                          className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0"></div>
                      )}
                      <div>
                        {index>0 && prevMsg.userName===msg.userName ? <></> :
                        <p className="text-sm font-semibold">{msg.userName}</p>
                        }
                        <div className="flex items-end space-x-2">
                          <div className="bg-gray-200 text-gray-800 p-3 rounded-lg max-w-xs">
                            {msg.type==='FILE' && msg.file?
                              (msg.file.mimeType.startsWith('image/') ? (
                                  <a href={`${import.meta.env.VITE_API_BASE_URL}/download/${msg.file.imageCode}/${msg.file.changeName}`} target="_blank" rel="noopener noreferrer">
                                    <img 
                                      src={`${import.meta.env.VITE_API_BASE_URL}/images/${msg.file.imageCode}/${msg.file.changeName}`}
                                      alt={msg.file.originName}
                                      className="w-full h-auto max-h-64 rounded-lg object-cover cursor-pointer"/>
                                  </a>
                                ) : (
                                  <a 
                                    href={`${import.meta.env.VITE_API_BASE_URL}/download/${msg.file.imageCode}/${msg.file.changeName}`} 
                                    download={msg.file.originName || "download"}
                                    className={`flex items-center space-x-2 p-3 rounded-lg max-w-xs cursor-pointer
                                            ${myProfile.userNo ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
                                  >
                                    {/* 파일 아이콘 */}
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 flex-shrink-0">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                    </svg>
                                    <span className="break-all">{msg.file.originName}</span>
                                  </a>
                                )
                              )
                              :(<p className="break-all">{msg.messageText}</p>)}
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
      {roomConfig.isOpen && myProfile && thisChatRoom && (
              <ChatRoomModal
                chatRooms={thisChatRoom}
                users={users}
                onUsersUpdate={setUsers}
                position={roomConfig.position}
                onClose={handlecloseSetModal}
                onRoomUserList={handleRoomUserList}
                onOpenFileUpload={onOpenFileUpload}
                onLeaveRoom={onLeaveRoom}
              />
              )}
      
    </>
  );
};

export default ChatRoom;