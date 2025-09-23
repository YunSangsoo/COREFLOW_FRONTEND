import type { customFile } from "./type";

export interface chatProfile {
    userNo : number;
    userName : string;
    status : string;
    profile : customFile;
}
export interface chatProfileDetail extends chatProfile{
    email : string;
    phone : string;
    depName : string;
    posName : string;
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
  initialData?: any; // ✅ 통화 제안(offer) 등 일회성 초기 데이터를 전달하기 위한 속성
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
  alarm : string;
}

// 메시지 타입을 정의합니다.
export interface ChatMessage {
  messageId:number;
  type: 'ENTER' | 'EXIT' | 'TALK' | 'FILE' | 'VIDEO_CALL_INVITE';
  userNo: number;
  messageText: string;
  userName: string;
  sentAt: Date;
  file?: customFile;
  // ... 기타 필드
}

//webRTC용 interface
export interface SignalMessage {
  type: SignalType;
  from: number;
  to: number;
  data: any ;
}

export type SignalType = 'offer' | 'answer' | 'ice' | 'user-offline' | 'hang-up';