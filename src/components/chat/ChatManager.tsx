import { useCallback, useEffect, useRef, useState } from 'react';
import FloatingWindow from './FloatingWindow';
import { DndContext, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import type { ChatManagerProps, ChatMessage, chatProfile, ChatRooms, SignalMessage, WindowState } from '../../types/chat';
import { api } from '../../api/coreflowApi';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { removeChatRoom, setChatRooms, updateChatRoom } from '../../features/chatSlice';
import { WindowContent } from './WindowContentProps';
import stompClient from '../../api/webSocketApi';
import type { StompSubscription } from '@stomp/stompjs';


const ChatManager = ({ onClose }: ChatManagerProps) => {
  const initialWidth = 480;
  const initialHeight = 600;
  const initialTop = (window.innerHeight - initialHeight) / 2;
  const initialLeft = (window.innerWidth - initialWidth) / 2;
  const [windows, setWindows] = useState<WindowState[]>([{
    id: "chat-menu",
    title: "채팅",
    zIndex: 10,
    position: { top: initialTop, left: initialLeft },
    width : 480,
    height : 620,
  }]);
  const [nextZIndex, setNextZIndex] = useState(11);

  const [myProfile, setMyProfile] = useState<chatProfile>();
  const [allUsers, setAllUsers] = useState<chatProfile[]>([]);
  const [favoriteUsers, setFavoriteUsers] = useState<chatProfile[]>([]);
  
  const [directFiles, setDirectFiles] = useState<File[]>([]);
  const [incomingCalls, setIncomingCalls] = useState<SignalMessage[]>([]);
  const signalHandlersRef = useRef<Map<number, (signal: SignalMessage) => void>>(new Map());
  const registerSignalHandler = useCallback((partnerNo: number, handler: (signal: SignalMessage) => void) => {
    signalHandlersRef.current.set(partnerNo, handler);
  }, []);
  const unregisterSignalHandler = useCallback((partnerNo: number) => {
    signalHandlersRef.current.delete(partnerNo);
  }, []);

  const dispatch = useDispatch();
  const allChatRooms = useSelector((state: RootState) => state.chat.chatRooms);


  useEffect(() => {
    Promise.all([
      api.get("/chatting/myProfile"),
      api.get("/chatting/user"),
      api.get("/chatting/favorites"),
      api.get("/chatting/myChattingRooms")
    ]).then(([profileRes, userRes, favRes, roomRes]) => {
      setMyProfile(profileRes.data);
      setAllUsers(userRes.data);
      setFavoriteUsers(favRes.data);
      dispatch(setChatRooms(roomRes.data));

    }).catch(error => {
      alert("초기 데이터를 불러오는 데 실패했습니다:");
    });
  }, [dispatch]);

  const handleAcceptCall = (callToAccept: SignalMessage) => {
    if (!myProfile) return;
    const partner = allUsers.find(user => user.userNo === callToAccept.from);
    if (!partner) { /* ... */ return; }

    const windowId = `video-${partner.userNo}`;
    const newWindow: WindowState = {
      id: windowId,
      title: `${partner.userName}님과 통화`,
      zIndex: nextZIndex,
      position: { top: initialTop, left: initialLeft },
      width: 600, height: 450,
      profileUser: partner,
      initialData: callToAccept.data, // ✅ 파라미터로 받은 통화의 offer 정보를 사용
    };
    setWindows(prev => [...prev, newWindow]);
    setNextZIndex(prev => prev + 1);

    // ✅ 2. 처리한 통화 요청을 수신 목록 배열에서 제거합니다.
    setIncomingCalls(prev => prev.filter(call => call.from !== callToAccept.from));
  };

  const handleStartVideoCall = (partner: chatProfile) => {
    if (!myProfile)
      return;
    const windowId = `video-${partner.userNo}`;
    if (windows.some(win => win.id === windowId))
      return;

    const newWindow: WindowState = {
      id: windowId,
      title: `${partner.userName}님과 통화`,
      zIndex: nextZIndex,
      position: { top: initialTop, left: initialLeft },
      width: 600, height: 450,
      profileUser: partner, // 기존 profileUser 속성에 '상대방' 정보 저장
      // initialData는 없으므로 '거는 사람'으로 동작
    };
    setWindows(prev => [...prev, newWindow]);
    setNextZIndex(prev => prev + 1);
  };

  const handleDeclineCall = (callToDecline: SignalMessage) => {
    alert(`[${callToDecline.from}]님의 전화를 거절합니다.`);
    setIncomingCalls(prev => prev.filter(call => call.from !== callToDecline.from));
  };
  
  const handleNewMessage = (room: ChatRooms, message: ChatMessage) => {
    if(message.type){
      const updatedRoom = { ...room, lastMessage: message };
      dispatch(updateChatRoom(updatedRoom));
    }
  };

  const handleOpenChatFromUser = async (user: chatProfile) => {
    const windowId = `room-${user.userNo}`;
    const existingWindow = windows.find(win => win.id === windowId);
    if (existingWindow) {
      handleFocusWindow(windowId);
      return;
    }
    if(!myProfile)
      return;

    try{
      const response = await api.get<ChatRooms>(`/chatting/private/${user.userNo}`)
      const chatRoomData = response.data;
      chatRoomData.myProfile=myProfile;
      const newWindow: WindowState = {
        id: windowId,
        title: chatRoomData.roomName,
        zIndex: nextZIndex,
        position: { top: initialTop, left: initialLeft },
        partner: chatRoomData.partner,
        chatRoomInfo : chatRoomData,
        width : 320,
        height : 600
      };
      setWindows([...windows, newWindow]);
      setNextZIndex(nextZIndex + 1);

      dispatch(updateChatRoom(chatRoomData));

    } catch(err){
      alert("채팅방 정보를 가져오는 데 실패했습니다");
    }
  };

  const handleLeaveRoom = async (roomId: number) => {
    if (!window.confirm("정말로 채팅방을 나가시겠습니까?")) {
      return;
    }
    try {
      // 1. 백엔드 API 호출
      await api.delete(`/chatting/room/${roomId}/leave`);
      // 2. Redux store에서 해당 채팅방 제거
      dispatch(removeChatRoom(roomId));
      // 3. 열려있는 채팅방 창 닫기
      const windowId = `room-${roomId}`;
      handleCloseWindow(windowId);
      alert("채팅방에서 나갔습니다.");

      if(myProfile){
        stompClient.publish({
            destination: `/api/chat/exit/${roomId}`,
            body: JSON.stringify({
              userNo : myProfile.userNo,
              userName : myProfile.userName,
              roomId:roomId,
              sentAt: new Date(),
              messageText: '',
              type: 'EXIT',
            }),
        });
      }

    } catch (error) {
      console.error("채팅방 나가기 실패:", error);
      alert("채팅방을 나가는 데 실패했습니다.");
    }
  };

  const handleOpenChatFromRoom = async (chatRoom: ChatRooms) => {
    const windowId = `room-${chatRoom.roomId}`;
    const existingWindow = windows.find(win => win.id === windowId);
    if (existingWindow) {
      handleFocusWindow(windowId);
      return;
    }
    try {
      // ✅ 창을 열기 전에, 해당 채팅방의 최신/상세 정보를 API로 다시 가져옵니다.
      const response = await api.get<ChatRooms>(`/chatting/room/${chatRoom.roomId}`);
      const detailedChatRoom = response.data;
      const newWindow: WindowState = {
        id: windowId,
        title: detailedChatRoom.roomName,
        zIndex: nextZIndex,
        position: { top: initialTop, left: initialLeft },
        chatRoomInfo: detailedChatRoom, // ✅ API로 가져온 최신 전체 정보를 사용
        width: 320,
        height: 600
      };
      setWindows([...windows, newWindow]);
      setNextZIndex(nextZIndex + 1);

    } catch (error) {
      alert("채팅방 정보를 불러오는 데 실패했습니다.");
    }
  };

  const handleOpenChatRoomUserList = (roomId:number, users:chatProfile[]) => {
    const windowId = `chat-userList-${roomId}`
    const existingWindow = windows.find(win => win.id === windowId);
    if (existingWindow) {
      handleFocusWindow(windowId);
      return;
    }
    const newWindow: WindowState = {
      id: windowId,
      title: "참여자 목록", // 채팅방 이름을 제목으로 사용
      zIndex: nextZIndex,
      partner : users,
      position: { top: initialTop, left: initialLeft },
      width : 200,
      height : 350
    };
    setWindows([...windows, newWindow]);
    setNextZIndex(nextZIndex + 1);
  }

  const handleMakeChatRoom = () => {
    const windowId = "new-chat";
    const existingWindow = windows.find(win => win.id === windowId);
    if (existingWindow) {
      handleFocusWindow(windowId);
      return;
    }
    const newWindow: WindowState = {
        id: windowId,
        title: "새 채팅방 생성",
        zIndex: nextZIndex,
        position: { top: initialTop, left: initialLeft },
        width : 420,
        height : 450
    };
    setWindows([...windows, newWindow]);
    setNextZIndex(nextZIndex + 1);
  }
  
  const handleCloseWindow = (id: string) => {
    const updatedWindows = windows.filter(win => win.id !== id);
    setWindows(updatedWindows);
    if (updatedWindows.length === 0) { 
        onClose();
    }
  };
  
  const handleFocusWindow = (id: string) => {
    setWindows(prevWindows => 
      prevWindows.map(win => ({
        ...win,
        zIndex: win.id === id ? nextZIndex : win.zIndex,
      }))
    );
    setNextZIndex(nextZIndex + 1);
  };
  
  const handleDragStart = (event: DragStartEvent) => {
    handleFocusWindow(event.active.id as string);
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const id = active.id as string;

    setWindows(currentWindows => 
      currentWindows.map(win => 
        win.id === id 
          ? { ...win, position: { 
              top: win.position.top + delta.y, 
              left: win.position.left + delta.x 
            } } 
          : win
      )
    );
  };
  const handleAddFavorite = async (
  user: chatProfile,
  event: React.MouseEvent,
  isCurrentlyFavorite: boolean
  ) => {
    event.stopPropagation();

    const originalFavorites = [...favoriteUsers]; // 에러 시 복구를 위해 원래 배열을 복사

    if (isCurrentlyFavorite) {
      // 즐겨찾기에서 제거: userNo가 다른 유저들만 남기기
      setFavoriteUsers(favoriteUsers.filter(favUser => favUser.userNo !== user.userNo));
    } else {
      // 즐겨찾기에 추가: 기존 배열에 새로운 유저 추가
      setFavoriteUsers([...favoriteUsers, user]);
    }

    try {
      if (isCurrentlyFavorite) {
        await api.delete(`/chatting/favorites/${user.userNo}`);
      } else {
        await api.post('/chatting/favorites', { favoriteUserNo: user.userNo });
      }
    } catch (error) {
      setFavoriteUsers(originalFavorites);
      alert('즐겨찾기 처리에 실패했습니다.');
    }
  }

  const handleCreationComplete = (newChatRoom: ChatRooms) => {
    const windowId = `room-${newChatRoom.roomId}`;
    
    // 함수형 업데이트로 창 상태 변경 (닫고 열기)
    setWindows(prevWindows => {
      const windowsWithoutCreator = prevWindows.filter(win => win.id !== 'new-chat');

      const newWindow: WindowState = {
        id: windowId,
        title: newChatRoom.roomName,
        zIndex: nextZIndex,
        position: { top: initialTop, left: initialLeft },
        chatRoomInfo: newChatRoom,
        width : 320,
        height : 600
      };

      return [...windowsWithoutCreator, newWindow];
    });
    dispatch(updateChatRoom(newChatRoom));
    setNextZIndex(prevZIndex => prevZIndex + 1);
  };
  
  const setState = async (state:string) =>{
    
    try {
      const res = await api.post(`/chatting/state`,{state:state});
      setMyProfile(res.data);
    } catch (error) {
      alert('프로필 상태 변경에 실패했습니다.');
    }
  }

  const handleSearchUsers = async (query: string): Promise<chatProfile[]> => {
    if (!query) return []; // 검색어가 없으면 빈 배열 반환
    const { data } = await api.get<chatProfile[]>('/chatting/searchUser', {
      params: { query }
    });
    return data;
  };

  const handleOpenProfile = (user: chatProfile) => {
    const windowId = `profile-${user.userNo}`;
    const existingWindow = windows.find(win => win.id === windowId);

    if (existingWindow) {
      handleFocusWindow(windowId);
      return;
    }

    const newWindow: WindowState = {
      id: windowId,
      title: "프로필",
      zIndex: nextZIndex,
      position: { top: initialTop, left: initialLeft },
      width: 320, // UI에 맞는 적절한 너비
      height: 480, // UI에 맞는 적절한 높이
      profileUser: user,
    };

    setWindows([...windows, newWindow]);
    setNextZIndex(nextZIndex + 1);
  };

  const handleOpenFileUpload = (chatRoom: ChatRooms, directFiles:File[]) => {
    const windowId = `file-upload-${chatRoom.roomId}`;
    if (windows.some(win => win.id === windowId)) {
      handleFocusWindow(windowId);
      return;
    }
    if(directFiles)
      setDirectFiles(directFiles);
    const newWindow: WindowState = {
      id: windowId,
      title: `"${chatRoom.roomName}" 파일 전송`,
      zIndex: nextZIndex,
      position: { top: initialTop + 20, left: initialLeft + 20 }, // 기존 창과 약간 겹치지 않게
      width: 350,
      height: 400,
      chatRoomInfo: chatRoom,
    };

    setWindows([...windows, newWindow]);
    setNextZIndex(nextZIndex + 1);
  };

  useEffect(() => {
    if (stompClient.connected && myProfile) {
      const subscription = stompClient.subscribe(`/user/queue/webrtc`, (message) => {
        const signal: SignalMessage = JSON.parse(message.body);

        switch (signal.type) {
          case 'offer':
            // 전화 제안이 오면 수신 목록에 추가
            setIncomingCalls(prev => [...prev, signal]);
            break;
          case 'answer':
          case 'ice':
            const handler = signalHandlersRef.current.get(signal.from);
            if (handler) handler(signal);
            break;
          case 'user-offline':
            // offer 외 다른 모든 시그널은 해당 통화 창의 핸들러를 찾아 전달
            const partnerNo = signal.from; // 신호를 보낸 사람 = 내가 전화 건 상대방
            // 1. 사용자에게 상대방이 오프라인임을 알립니다.
            alert("상대방이 접속 중이 아니거나 통화할 수 없는 상태입니다.");
            // 2. 방금 내가 열었던 화상채팅 창을 즉시 닫습니다.
            handleCloseWindow(`video-${partnerNo}`);
            // 3. (부가 기능) 서버에 부재중 전화 메시지를 남겨달라고 요청합니다.
            api.post('/chatting/room/missed-call', { partnerNo: partnerNo });
            break;
          case 'hang-up':
            alert("상대방이 접속을 종료했습니다.");
            handleCloseWindow(`video-${signal.from}`);
            break;
        }
      });
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [myProfile,handleCloseWindow]);
  
  if(!myProfile)
    return;

  return (
    <>
      <div className="fixed inset-0 z-40 pointer-events-none">
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          {windows.map(window => (
            <FloatingWindow
              key={window.id}
              id={window.id}
              title={window.title}
              onClose={handleCloseWindow}
              onFocus={handleFocusWindow}
              zIndex={window.zIndex}
              position={window.position}
              w={window.width}
              h={window.height}
            >
              <WindowContent
                window={window}
                myProfile={myProfile}
                allUsers={allUsers}
                favoriteUsers={favoriteUsers}
                allChatRooms={allChatRooms}
                directFiles={directFiles}
                handleOpenChatFromUser={handleOpenChatFromUser}
                handleOpenChatFromRoom={handleOpenChatFromRoom}
                handleMakeChatRoom={handleMakeChatRoom}
                handleAddFavorite={handleAddFavorite}
                setState={setState}
                handleSearchUsers={handleSearchUsers}
                handleCreationComplete={handleCreationComplete}
                handleNewMessage={handleNewMessage}
                handleOpenChatRoomUserList={handleOpenChatRoomUserList}
                handleOpenProfile={handleOpenProfile}
                handleSetMyProfile={setMyProfile}
                handleOpenFileUpload={handleOpenFileUpload}
                handleCloseWindow={handleCloseWindow}
                handleLeaveRoom={handleLeaveRoom}
                handleStartVideoCall={handleStartVideoCall}
                registerSignalHandler={registerSignalHandler}
                unregisterSignalHandler={unregisterSignalHandler}
              />
            </FloatingWindow>
          ))}
        </DndContext>
      </div >
      <div className="fixed top-0 left-0 border-black ">
        {incomingCalls.map(call => (
          <div key={call.from} className=" bg-white p-4 rounded-lg shadow-xl">
            <p className="font-semibold">영상통화 요청이 왔습니다.</p>
            <div className="flex justify-end mt-4 space-x-2">
              <button 
                onClick={() => handleDeclineCall(call)} 
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                거절
              </button>
              <button 
                onClick={() => handleAcceptCall(call)} 
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
              >
                수락
              </button>
            </div>
          </div>
        ))}
        </div>
    </>
  );
};

export default ChatManager;