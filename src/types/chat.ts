export interface chatProfile {
    userNo : number;
    userName : string;
    status : string;
    email : string;
    phone : string;
}

// ChatMenu 컴포넌트가 받을 props의 타입을 정의합니다.
export interface ChatMenuProps {
  myProfile:chatProfile;
  allUsers: chatProfile[];
  favoriteUsers: chatProfile[];
  allChatRooms: ChatRooms[];
  onUserClick: (user: chatProfile) => void;
  onChatRoomClick: (room: ChatRooms) => void;
  onMakeChatRoomClick: () => void;
  onToggleFavorite: (
  user: chatProfile,
  event: React.MouseEvent,
  isCurrentlyFavorite: boolean
  ) => void;
  onSetState : (state:string) => void;
  onSearchUser :(query: string) => Promise<chatProfile[]>;
  onOpenProfile : (user: chatProfile) =>void;
}

// 모달 상태를 위한 타입 정의
export interface ModalState {
  isOpen: boolean;
  user: chatProfile | null;
  position: { top: number; left: number };
}

export interface WindowState {
  id: string;
  title: string;
  zIndex: number;
  position: { top: number, left: number };
  partner?: chatProfile[];
  chatRoomInfo? : ChatRooms;
  profileUser?: chatProfile;
  width : number;
  height : number;
}

export interface ChatManagerProps {
  onClose: () => void;
}

export interface ChatRooms {
  roomId : number;
  roomName : string;
  roomType : string;
  myProfile : chatProfile;
  status : 'T'|'F';
  createdAt : Date;
  partner : chatProfile[];
  lastMessage? : ChatMessage;
  unreadCount: number;
}

// 메시지 타입을 정의합니다.
export interface ChatMessage {
  type: 'ENTER' | 'EXIT' | 'TALK';
  userNo: number;
  messageText: string;
  userName: string;
  sentAt: Date;
  // ... 기타 필드
}