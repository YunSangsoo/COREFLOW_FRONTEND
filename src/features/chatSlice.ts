import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { chatProfile, ChatRooms } from '../types/chat'; // ChatRooms 타입 경로
import type { RootState } from '../store/store';

interface ChatState {
  chatRooms: ChatRooms[];
  globalUnreadCount: number;
}

const initialState: ChatState = {
  chatRooms: [],
  globalUnreadCount: 0,
};

// 총 안 읽은 메시지 수를 계산하는 헬퍼 함수
const calculateTotalUnread = (rooms: ChatRooms[]): number => {
  return rooms.reduce((total, room) => total + (room.unreadCount || 0), 0);
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // 채팅방 목록 전체를 설정하는 액션
    setChatRooms: (state, action: PayloadAction<ChatRooms[]>) => {
      state.chatRooms = action.payload;
      state.globalUnreadCount = calculateTotalUnread(action.payload);
    },
    // 특정 채팅방을 업데이트하거나 새로 추가하는 액션
    updateChatRoom: (state, action: PayloadAction<ChatRooms>) => {
      const updatedRoom = action.payload;
      // 기존 목록에서 업데이트된 방을 제거
      const filteredRooms = state.chatRooms.filter(room => room.roomId !== updatedRoom.roomId);
      // 목록의 가장 맨 위에 업데이트된 방을 추가하여 새로운 상태를 만듦
      state.chatRooms = [updatedRoom, ...filteredRooms];
      // 채팅방이 업데이트될 때 (예: 새 메시지 도착), globalUnreadCount도 다시 계산
      state.globalUnreadCount = calculateTotalUnread(state.chatRooms);
    },// ▼▼▼ 알림만 끄는 새로운 리듀서 추가 ▼▼▼
    clearGlobalUnreadCount: (state) => {
      state.globalUnreadCount = 0;
    },
    updateChatRoomParticipants: (state, action: PayloadAction<{ roomId: number; newParticipants: chatProfile[] }>) => {
      const { roomId, newParticipants } = action.payload;
      const roomIndex = state.chatRooms.findIndex(room => room.roomId === roomId);
      if (roomIndex !== -1) {
        state.chatRooms[roomIndex].partner = newParticipants;
      }
    },
    removeChatRoom: (state, action: PayloadAction<number>) => {
      const roomIdToRemove = action.payload;
      state.chatRooms = state.chatRooms.filter(room => room.roomId !== roomIdToRemove);
      state.globalUnreadCount = calculateTotalUnread(state.chatRooms);
    },
  },
});


export const { setChatRooms, updateChatRoom,clearGlobalUnreadCount,updateChatRoomParticipants, removeChatRoom } = chatSlice.actions;

// MainPage에서 사용할 새로운 Selector
export const selectGlobalUnreadCount = (state: RootState) => state.chat.globalUnreadCount;

export const selectTotalUnreadCount = (state: RootState) => 
  state.chat.chatRooms.reduce((total, room) => total + (room.unreadCount || 0), 0);
export default chatSlice.reducer; // reducer를 default export 합니다.