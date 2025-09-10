import { useEffect, useState } from 'react';
import FloatingWindow from './FloatingWindow';
import ChatMenu from './ChatMenu';
import { DndContext, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import type { ChatManagerProps, chatProfile, ChatRooms, WindowState } from '../../types/chat';
import { api } from '../../api/coreflowApi';
import ChatRoom from './ChatRoom';
import NewChat from './NewChat';


const ChatManager = ({ onClose }: ChatManagerProps) => {
  const initialWidth = 320;
  const initialHeight = 400;
  const initialTop = (window.innerHeight - initialHeight) / 2;
  const initialLeft = (window.innerWidth - initialWidth) / 2;
  const [windows, setWindows] = useState<WindowState[]>([{
    id: "chat-menu",
    title: "채팅",
    zIndex: 10,
    position: { top: initialTop, left: initialLeft }
  }]);
  const [nextZIndex, setNextZIndex] = useState(11);
  const [myProfile, setMyProfile] = useState<chatProfile>();
  const [allUsers, setAllUsers] = useState<chatProfile[]>([]);
  const [favoriteUsers, setFavoriteUsers] = useState<chatProfile[]>([]);
  const [allChatRooms, setAllChatRooms] = useState<ChatRooms[]>([]);


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
      setAllChatRooms(roomRes.data);
    }).catch(error => {
      console.error("초기 데이터를 불러오는 데 실패했습니다:", error);
    });
  }, []);

  if(!myProfile)
    return;

  const handleOpenChatFromUser = async (user: chatProfile) => {
    const windowId = `chat-${user.userNo}`;
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
      };
      setWindows([...windows, newWindow]);
      setNextZIndex(nextZIndex + 1);

      setAllChatRooms(prevRooms => {
        const roomExists = prevRooms.some(room => room.roomId === chatRoomData.roomId);
        return roomExists ? prevRooms : [chatRoomData, ...prevRooms];
      });
    } catch(err){
      console.error("채팅방 정보를 가져오는 데 실패했습니다:", err);
      // 사용자에게 에러 알림을 보여주는 등의 처리를 할 수 있습니다.
    }
  };



  const handleOpenChatFromRoom = async (chatRoom: ChatRooms) => {
    const windowId = `chat-${chatRoom.roomId}`;
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
    };
    setWindows([...windows, newWindow]);
    setNextZIndex(nextZIndex + 1);
  };

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
      // 즐겨찾기에서 제거: userNo가 다른 유저들만 남깁니다.
      setFavoriteUsers(favoriteUsers.filter(favUser => favUser.userNo !== user.userNo));
    } else {
      // 즐겨찾기에 추가: 기존 배열에 새로운 유저를 추가합니다.
      setFavoriteUsers([...favoriteUsers, user]);
    }

    try {
      if (isCurrentlyFavorite) {
        console.log(`/chatting/favorites/${user.userNo}`);
        await api.delete(`/chatting/favorites/${user.userNo}`);
      } else {
        await api.post('/chatting/favorites', { favoriteUserNo: user.userNo });
      }
    } catch (error) {
      console.error("Failed to update favorite:", error);
      //에러 발생 시, 복사해둔 원래 배열로 state를 되돌립니다.
      setFavoriteUsers(originalFavorites);
      alert('즐겨찾기 처리에 실패했습니다.');
    }
  }

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
          >
          {window.id === 'chat-menu' ? (
            <ChatMenu
              allUsers={allUsers}
              favoriteUsers={favoriteUsers}
              allChatRooms={allChatRooms}
              onUserClick={handleOpenChatFromUser}
              onChatRoomClick={handleOpenChatFromRoom}
              onMakeChatRoomClick={handleMakeChatRoom}
              onToggleFavorite={handleAddFavorite} 
            />
            ) : (
              window.id==='new-chat'? (
              <>
                <NewChat
                  myProfile={myProfile}
                  onOpenChatRoom={handleOpenChatFromRoom} // 새 채팅방을 여는 함수 전달
                  onClose={() => handleCloseWindow("new-chat")} // 창 닫기 함수 전달
                />
              </>
              ) : (
                window.chatRoomInfo ? (
                  <ChatRoom
                    {...window.chatRoomInfo}
                    myProfile={myProfile}
                  />
                ) : (<p>채팅 정보를 불러오는 중입니다...</p>)
                )
            )
          }
          </FloatingWindow>
        ))}
      </DndContext>
    </div>
  );
};

export default ChatManager;