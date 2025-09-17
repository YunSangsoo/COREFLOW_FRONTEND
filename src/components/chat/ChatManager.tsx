import { useEffect, useState } from 'react';
import FloatingWindow from './FloatingWindow';
import ChatMenu from './ChatMenu';
import { DndContext, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import type { ChatManagerProps, ChatMessage, chatProfile, ChatRooms, WindowState } from '../../types/chat';
import { api } from '../../api/coreflowApi';
import ChatRoom from './ChatRoom';
import NewChat from './NewChat';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { removeChatRoom, setChatRooms, updateChatRoom } from '../../features/chatSlice';
import { WindowContent } from './WindowContentProps';


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

  const [searchKeyword, setSearchKeyword] = useState({
    keyword:''
  })

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

  if(!myProfile)
    return;

  const handleNewMessage = (room: ChatRooms, message: ChatMessage) => {
    const updatedRoom = { ...room, lastMessage: message };
    dispatch(updateChatRoom(updatedRoom));
  };

  const handleOpenChatFromUser = async (user: chatProfile) => {
    const windowId = `room-${user.userNo}`;
    const existingWindow = windows.find(win => win.id === windowId);
    if (existingWindow) {
      handleFocusWindow(windowId);
      return;
    }

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
    const newWindow: WindowState = {
      id: windowId,
      title: chatRoom.roomName, // 채팅방 이름을 제목으로 사용
      zIndex: nextZIndex,
      partner : chatRoom.partner,
      position: { top: initialTop, left: initialLeft },
      chatRoomInfo: chatRoom,
      width : 320,
      height : 600
    };
    setWindows([...windows, newWindow]);
    setNextZIndex(nextZIndex + 1);
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

  const handleOpenFileUpload = (chatRoom: ChatRooms) => {
    const windowId = `file-upload-${chatRoom.roomId}`;
    if (windows.some(win => win.id === windowId)) {
      handleFocusWindow(windowId);
      return;
    }

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

  return (
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
            />
          </FloatingWindow>
        ))}
      </DndContext>
    </div>
  );
};

export default ChatManager;