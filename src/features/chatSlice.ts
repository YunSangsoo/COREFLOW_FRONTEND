import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ChatRooms } from '../types/chat'; // ChatRooms 타입 경로

interface ChatState {
  chatRooms: ChatRooms[];
}

const initialState: ChatState = {
  chatRooms: [],
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // 채팅방 목록 전체를 설정하는 액션
    setChatRooms: (state, action: PayloadAction<ChatRooms[]>) => {
      state.chatRooms = action.payload;
    },
    // 특정 채팅방을 업데이트하거나 새로 추가하는 액션
    updateChatRoom: (state, action: PayloadAction<ChatRooms>) => {
      const updatedRoom = action.payload;
      // 기존 목록에서 업데이트된 방을 제거
      const filteredRooms = state.chatRooms.filter(room => room.roomId !== updatedRoom.roomId);
      // 목록의 가장 맨 위에 업데이트된 방을 추가하여 새로운 상태를 만듦
      state.chatRooms = [updatedRoom, ...filteredRooms];
    },
  },
});

export const { setChatRooms, updateChatRoom } = chatSlice.actions;
export default chatSlice.reducer; // reducer를 default export 합니다.