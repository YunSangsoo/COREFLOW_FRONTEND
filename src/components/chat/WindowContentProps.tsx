import type { ChatMessage, chatProfile, ChatRooms, WindowState } from "../../types/chat";
import ChatMenu from "./ChatMenu";
import ChatRoom from "./ChatRoom";
import { ChatRoomUserInfo } from "./ChatRoomUserInfo";
import NewChat from "./NewChat";

interface WindowContentProps {
    window: WindowState;
    myProfile: chatProfile;
    allUsers: chatProfile[];
    favoriteUsers: chatProfile[];
    allChatRooms: ChatRooms[];
    handleOpenChatFromUser: (user: chatProfile) => void;
    handleOpenChatFromRoom: (room: ChatRooms) => void;
    handleMakeChatRoom: () => void;
    handleAddFavorite: (user: chatProfile, event: React.MouseEvent, isFavorite: boolean) => void;
    setState: (state: string) => void;
    handleSearchUsers: (query: string) => Promise<chatProfile[]>;
    handleCreationComplete: (newChatRoom: ChatRooms) => void;
    handleNewMessage: (room: ChatRooms, message: ChatMessage) => void;
    handleOpenChatRoomUserList: (roomId:number, users:chatProfile[] ) => void; 

}

export const WindowContent = (props: WindowContentProps) => {
  const { window, ...rest } = props;

  if (window.id === 'chat-menu') {
    return <ChatMenu
        myProfile={rest.myProfile}
        allUsers={rest.allUsers}
        favoriteUsers={rest.favoriteUsers}
        allChatRooms={rest.allChatRooms}
        onUserClick={rest.handleOpenChatFromUser}
        onChatRoomClick={rest.handleOpenChatFromRoom}
        onMakeChatRoomClick={rest.handleMakeChatRoom}
        onToggleFavorite={rest.handleAddFavorite}
        onSetState={rest.setState}
        onSearchUser={rest.handleSearchUsers}
    />;
  }

  if (window.id === 'new-chat') {
    return <NewChat
        myProfile={rest.myProfile}
        onCreationComplete={rest.handleCreationComplete}
    />;
  }
  
  if (window.id.startsWith('chat-userList-')&&window.partner) {
    return<ChatRoomUserInfo users={window.partner}
    />;
  }

  if (window.id.startsWith('room-')&&window.chatRoomInfo) {
    return <ChatRoom
    {...window.chatRoomInfo} 
    myProfile={rest.myProfile} 
    onNewMessage={rest.handleNewMessage}
    onRoomUserList={rest.handleOpenChatRoomUserList}
    />;
  }

  return <p>콘텐츠를 불러오는 중입니다...</p>;
};