import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { chatProfile, ChatRooms } from '../../types/chat';
import ChatPeoplePickerDialog from './ChatPeoplePickerDialog';
import { api } from '../../api/coreflowApi';
import { ChatRoomUploadFile } from './ChatRoomUploadFile';
import { updateChatRoom } from '../../features/chatSlice';
import { useDispatch } from 'react-redux';
import stompClient from '../../api/webSocketApi';

interface UserActionModalProps {
  user: chatProfile;
  position: { top: number; left: number };
  onClose: () => void;
  onStartChat: (user: chatProfile) => void;
  onViewProfile: (user: chatProfile) => void;
}
interface UserStateModalProps {
  user: chatProfile;
  position : {top:number; left:number};
  onClose :()=>void;
  onSetState: (state:string) => void;
}
interface chatRoomModalProps {
  chatRooms: ChatRooms;
  users : chatProfile[];
  position : {top:number; left:number};
  onClose :()=>void;
  onUsersUpdate :(user:chatProfile[]) => void;
  onRoomUserList :() => void;
  onOpenFileUpload: (chatRoom: ChatRooms, directFiles:File[]) => void;
  onLeaveRoom:(roomId : number) => void;
  onStartVideoCall: (partner: chatProfile) => void;
}


const UserActionModal = ({ user, position, onClose, onStartChat, onViewProfile }: UserActionModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const modalContent = (
    <div
      ref={modalRef}
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl w-40"
      style={{ top: position.top, left: position.left }}
    >
      <ul className="py-2 text-sm text-gray-700">
        <li>
          <button
            onClick={() => { onStartChat(user); onClose(); }}
            className="w-full text-left block px-4 py-2 hover:bg-gray-100"
          >
            1:1 채팅
          </button>
        </li>
        <li>
          <button
            onClick={() => { onViewProfile(user); onClose(); }}
            className="w-full text-left block px-4 py-2 hover:bg-gray-100"
          >
            프로필 조회
          </button>
        </li>
      </ul>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default UserActionModal;


export const UserStateModal = ({ user, position, onClose, onSetState }: UserStateModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const modalContent = (
    <div
      ref={modalRef}
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl w-40"
      style={{ top: position.top, left: position.left }}
    >
      <ul className="py-2 text-sm text-gray-700">
        {user.status!=="온라인" ?
        <li>
          <button
            onClick={() => { onSetState("온라인"); onClose(); }}
            className="w-full text-left block px-4 py-2 hover:bg-gray-100"
          >
            온라인
          </button>
        </li> : <></>}
        {user.status!=="자리비움" ?
        <li>
          <button
            onClick={() => { onSetState("자리비움"); onClose(); }}
            className="w-full text-left block px-4 py-2 hover:bg-gray-100"
          >
            자리비움
          </button>
        </li> : <></>}
        {user.status!=="식사중" ?
        <li>
          <button
            onClick={() => { onSetState("식사중"); onClose(); }}
            className="w-full text-left block px-4 py-2 hover:bg-gray-100"
          >
            식사중
          </button>
        </li> : <></>}
        {user.status!=="회의중" ?
        <li>
          <button
            onClick={() => { onSetState("회의중"); onClose(); }}
            className="w-full text-left block px-4 py-2 hover:bg-gray-100"
          >
            회의중
          </button>
        </li> : <></>}
        {user.status!=="오프라인" ?
        <li>
          <button
            onClick={() => { onSetState("오프라인"); onClose(); }}
            className="w-full text-left block px-4 py-2 hover:bg-gray-100"
          >
            오프라인
          </button>
        </li> : <></>}
      </ul>
    </div>
  );

  return createPortal(modalContent, document.body);
};

const EMPTY_USER_LIST: chatProfile[] = [];

export const ChatRoomModal = ({ chatRooms, users, position, onClose, onUsersUpdate, onRoomUserList,onOpenFileUpload, onLeaveRoom,onStartVideoCall}: chatRoomModalProps) => {
  const [isPickerOpen, setPickerOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  
  const dispatch = useDispatch();
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isPickerOpen) {
        return;
      }
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
    
  }, [onClose,isPickerOpen]);


  const handleConfirmPicker = useCallback(async (pickedUsers: chatProfile[]) => {
    // 1. 유효성 검사
    if (pickedUsers.length === 0) {
      alert('추가할 참여자를 1명 이상 선택해주세요.');
      return;
    }

    try {
      // 2. 서버에 POST 요청 보내기
      // roomId는 현재 채팅방의 ID라고 가정합니다. 이 값은 props나 다른 state로부터 받아와야 합니다.
      const response = await api.post('/chatting/room/join', { 
        roomId: chatRooms.roomId, 
        usersToInvite: pickedUsers.map(user => user.userNo) // userNo 배열만 보낼 수도 있습니다.
      });

      // 3. 요청이 성공했을 때만 상태 업데이트 및 UI 변경
      if (response.status === 200) {
        // Map을 사용해 기존 사용자와 새로 추가된 사용자를 합치고 중복을 제거
        const combinedUsers = new Map();
        users.forEach(user => combinedUsers.set(user.userNo, user));
        pickedUsers.forEach(user => combinedUsers.set(user.userNo, user));
        
        const newSelectedUsers = Array.from(combinedUsers.values());
        onUsersUpdate(newSelectedUsers);

        setPickerOpen(false); // 초대 모달 닫기
        onClose(); // 메인 모달 닫기

        pickedUsers.forEach(user =>{
            stompClient.publish({
            destination: `/app/chat/enter/${chatRooms.roomId}`,
            body: JSON.stringify({
              userNo : user.userNo,
              userName : user.userName,
              roomId:chatRooms.roomId,
              sentAt: new Date(),
              messageText: '',
              type: 'ENTER',
            }),
          });
        })
      
      }
    } catch (error) {
      // 4. 요청 실패 시 에러 처리
      alert('참여자 초대에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }

  }, [onUsersUpdate, onClose, chatRooms.roomId]);

  const handleClosePicker = useCallback(() => {
    setPickerOpen(false);
  }, []);

  const handleChangeAlarm = async(value:string) =>{
    try{
      const response = await api.patch<ChatRooms>('chatting/room/alarm',{
        roomId:chatRooms.roomId,
        alarm:value,
      });
      const backMessage = chatRooms.lastMessage;
      const updatedRoom = response.data;
      if(backMessage)
        updatedRoom.lastMessage=backMessage;
      dispatch(updateChatRoom(updatedRoom));
    }catch(error) {
      alert('알람 변경에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  }

  const modalContent = (
    <>
      <div
        ref={modalRef}
        className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl w-40"
        style={{ top: position.top, left: position.left }}
      >
        <ul className="py-2 text-sm text-gray-700">
          <li>
            <button
              onClick={() =>{onRoomUserList();onClose();}}
              className="w-full text-left block px-4 py-2 hover:bg-gray-100"
            >
              대화 상대
            </button>
          </li>
          {chatRooms.roomType === 'PRIVATE' && (
          <li>
            <button
              onClick={() => {
                // 파트너 정보가 있고, 1명일 때만 실행
                if (chatRooms.partner && chatRooms.partner.length === 1) {
                  onStartVideoCall(chatRooms.partner[0]);
                  onClose(); // 메뉴 닫기
                }
              }}
              className="w-full text-left block px-4 py-2 hover:bg-gray-100"
            >
              화상채팅하기
            </button>
          </li>
        )}
          {chatRooms.roomType==='PUBLIC' ? 
            (<li>
              <button
                onClick={() => {setPickerOpen(true);}}
                className="w-full text-left block px-4 py-2 hover:bg-gray-100"
              >
                초대하기
              </button>
            </li>
            ) : (<></>)
          }
          <li>
            <button
              onClick={() =>{onOpenFileUpload(chatRooms,[]);onClose();}}
              className="w-full text-left block px-4 py-2 hover:bg-gray-100"
            >
              파일 전송
            </button>
          </li>
          {chatRooms.alarm=='T' ?
            (<li>
              <button
                onClick={() =>{handleChangeAlarm('F');onClose();}}
                className="w-full text-left block px-4 py-2 hover:bg-gray-100"
              >
                알람 끄기
              </button>
            </li>) : (
              
            <li>
              <button
                onClick={() =>{handleChangeAlarm('T');onClose();}}
                className="w-full text-left block px-4 py-2 hover:bg-gray-100"
              >
                알람 키기
              </button>
            </li>
            )
          }
          {chatRooms.roomType==='PUBLIC' ? 
          (<li>
            <button
              onClick={()=>{onLeaveRoom(chatRooms.roomId);onClose();}}
              className="w-full text-left block px-4 py-2 hover:bg-gray-100"
            >
              채팅방 나가기
            </button>
          </li>) : (<></>)
          }
        </ul>
      </div>
      <ChatPeoplePickerDialog
              open={isPickerOpen}
              onClose={handleClosePicker}
              onConfirm={handleConfirmPicker}
              excludeNos={users.map(user => user.userNo)}
              initialSelected={EMPTY_USER_LIST}
      />
    </>
  );

  return createPortal(modalContent, document.body);
};