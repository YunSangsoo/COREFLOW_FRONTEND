import type { ChatMessage, chatProfile, ChatRooms, SignalMessage, WindowState } from "../../types/chat";
import ChatMenu from "./ChatMenu";
import { ProfileWindow } from "./ChatProfile";
import ChatRoom from "./ChatRoom";
import { ChatRoomUploadFile } from "./ChatRoomUploadFile";
import { ChatRoomUserInfo } from "./ChatRoomUserInfo";
import NewChat from "./NewChat";
import { VideoChatWindow } from "./VideoChatWindow";

interface WindowContentProps {
    window: WindowState;
    myProfile: chatProfile;
    allUsers: chatProfile[];
    favoriteUsers: chatProfile[];
    allChatRooms: ChatRooms[];
    directFiles : File[];
    handleOpenChatFromUser: (user: chatProfile) => void;
    handleOpenChatFromRoom: (room: ChatRooms) => void;
    handleMakeChatRoom: () => void;
    handleAddFavorite: (user: chatProfile, event: React.MouseEvent, isFavorite: boolean) => void;
    setState: (state: string) => void;
    handleSearchUsers: (query: string) => Promise<chatProfile[]>;
    handleCreationComplete: (newChatRoom: ChatRooms) => void;
    handleNewMessage: (room: ChatRooms, message: ChatMessage) => void;
    handleOpenChatRoomUserList: (roomId:number, users:chatProfile[] ) => void; 
    handleOpenProfile:(user: chatProfile) =>void;
    handleSetMyProfile:(user: chatProfile) =>void;
    handleOpenFileUpload: (chatRoom: ChatRooms, directFiles:File[]) => void;
    handleCloseWindow: (id: string) => void;
    handleLeaveRoom : (roomId : number) => void;
    handleStartVideoCall: (partner: chatProfile) => void;
    registerSignalHandler: (partnerNo: number, handler: (signal: SignalMessage) => void) => void;
    unregisterSignalHandler: (partnerNo: number) => void;

}

export const WindowContent = (props: WindowContentProps) => {
  const { window,
    myProfile,
    allUsers,
    favoriteUsers,
    allChatRooms,
    directFiles,
    handleOpenChatFromUser,
    handleOpenChatFromRoom,
    handleMakeChatRoom,
    handleAddFavorite,
    setState,
    handleSearchUsers,
    handleCreationComplete,
    handleNewMessage,
    handleOpenChatRoomUserList,
    handleOpenProfile,
    handleSetMyProfile,
    handleOpenFileUpload,
    handleCloseWindow,
    handleLeaveRoom,
    handleStartVideoCall,
    registerSignalHandler,
    unregisterSignalHandler,
  } = props;

  if (window.id === 'chat-menu') {
    return <ChatMenu
        myProfile={myProfile}
        allUsers={allUsers}
        favoriteUsers={favoriteUsers}
        allChatRooms={allChatRooms}
        onUserClick={handleOpenChatFromUser}
        onChatRoomClick={handleOpenChatFromRoom}
        onMakeChatRoomClick={handleMakeChatRoom}
        onToggleFavorite={handleAddFavorite}
        onSetState={setState}
        onSearchUser={handleSearchUsers}
        onOpenProfile={handleOpenProfile}
    />;
  }

  if (window.id === 'new-chat') {
    return <NewChat
        myProfile={myProfile}
        onCreationComplete={handleCreationComplete}
    />;
  }
  
  if (window.id.startsWith('chat-userList-')&&window.partner) {
    return<ChatRoomUserInfo
    users={window.partner}
    onOpenProfile={handleOpenProfile}
    />;
  }

  if (window.id.startsWith('room-')&&window.chatRoomInfo) {
    return <ChatRoom
      {...window.chatRoomInfo} 
      myProfile={myProfile} 
      onNewMessage={handleNewMessage}
      onRoomUserList={handleOpenChatRoomUserList}
      onOpenProfile={handleOpenProfile}
      onOpenFileUpload={handleOpenFileUpload}
      onLeaveRoom={handleLeaveRoom}
      onStartVideoCall={handleStartVideoCall}
    />;
  }

  if (window.id.startsWith('profile-') && window.profileUser) {
    return <ProfileWindow 
      user={window.profileUser}
      onStartChat={handleOpenChatFromUser}
      onSetMyProfile={handleSetMyProfile}
    />;
  }

  if (window.id.startsWith('file-upload-') && window.chatRoomInfo) {
    return <ChatRoomUploadFile
      chatRoom={window.chatRoomInfo}
      myProfile={myProfile}
      onUploadComplete={() => handleCloseWindow(window.id)}
      directFiles={directFiles}
    />;
  }
  if (window.id.startsWith('video-') && window.profileUser) {
    return <VideoChatWindow
      myProfile={myProfile} // ChatManager에서 직접 받은 내 프로필
      partnerProfile={window.profileUser} // window 객체에 저장된 상대방 프로필
      initialOffer={window.initialData} // window 객체에 저장된 offer 정보
      onHangUp={() => handleCloseWindow(window.id)} // 창 닫기 함수
      registerSignalHandler={registerSignalHandler}
      unregisterSignalHandler={unregisterSignalHandler}
    />;
  }

  return <p>콘텐츠를 불러오는 중입니다...</p>;
};