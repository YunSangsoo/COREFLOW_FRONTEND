import { useState } from "react";
import type { chatProfile, ChatRooms } from "../../types/chat";
import { api } from "../../api/coreflowApi";
import ChatPeoplePickerDialog from "./ChatPeoplePickerDialog";

interface NewChatProps {
  myProfile: chatProfile;
  onOpenChatRoom: (chatRoom: ChatRooms) => void;
  onClose: () => void;
}

const NewChat = ({ myProfile, onOpenChatRoom, onClose }: NewChatProps) => {
  const [roomName, setRoomName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<chatProfile[]>([]);
  const [isPickerOpen, setPickerOpen] = useState(false);
  const [newChatRoom, setNewChatRoom] = useState<ChatRooms>();

  
  // 사용자 선택 모달에서 '선택 완료'를 눌렀을 때 호출될 함수
  const handleConfirmPicker = (pickedUsers: chatProfile[]) => {
    setSelectedUsers(pickedUsers);
    setPickerOpen(false); // 모달 닫기
  };

  // 채팅방 생성 핸들러
  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      alert('채팅방 이름을 입력해주세요.');
      return;
    }
    if (selectedUsers.length === 0) {
      alert('참여자를 1명 이상 선택해주세요.');
      return;
    }

    const participants = [myProfile, ...selectedUsers];
    const participantUserNos = participants.map(p => p.userNo);

    try {
      const response = await api.post<ChatRooms>('/chatting/public', {
        roomName: roomName,
        participantUserNos: participantUserNos
      });
      setNewChatRoom(response.data);
    } catch (error) {
      console.error('채팅방 생성에 실패했습니다:', error);
      alert('채팅방 생성에 실패했습니다.');
    } finally {
      if(newChatRoom){
        onOpenChatRoom(newChatRoom);
      }
      onClose(); // 현재 창 닫기
    }
  };

  return (
    <>
      {/* 새 채팅방 생성 UI */}
      <div className="flex flex-col h-full p-2 space-y-4">
        {/* 채팅방 이름 입력 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">채팅방 이름</label>
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            placeholder="채팅방 이름을 입력하세요"
          />
        </div>

        {/* 참여자 선택 버튼 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">참여자</label>
          <button
            onClick={() => setPickerOpen(true)} // 클릭 시 사용자 선택 모달 열기
            className="mt-1 w-full text-left p-2 border border-gray-300 rounded-md text-gray-500"
          >
            참여자 검색...
          </button>
        </div>
        
        {/* 선택된 사용자 표시 */}
        <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[120px] bg-gray-50">
          {selectedUsers.map(user => (
            <span 
              key={user.userNo}
              className="flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full"
            >
              {user.userName}
              {/* (선택) 여기서도 사용자 제거 버튼을 만들 수 있습니다. */}
            </span>
          ))}
        </div>

        {/* 생성하기 버튼 */}
        <div className="flex-grow flex items-end justify-end">
          <button
            onClick={handleCreateRoom}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700"
          >
            생성하기
          </button>
        </div>
      </div>

      {/* 사용자 선택 모달 (조건부 렌더링) */}
      <ChatPeoplePickerDialog
        open={isPickerOpen}
        onClose={() => setPickerOpen(false)}
        onConfirm={handleConfirmPicker}
        initialSelected={selectedUsers}
        excludeNos={[myProfile.userNo]} // 나 자신은 목록에서 제외
      />
    </>
  );
};

export default NewChat;