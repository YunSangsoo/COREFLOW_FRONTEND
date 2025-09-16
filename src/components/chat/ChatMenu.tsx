import React, { useState } from 'react';
import type { ChatMenuProps, chatProfile, ModalState } from '../../types/chat';
import UserActionModal, { UserStateModal } from './UserActionModal';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '../../hooks/useDebounce';


const ChatMenu = ({ myProfile, allUsers, favoriteUsers, allChatRooms, onUserClick, onChatRoomClick, onMakeChatRoomClick, onToggleFavorite,onSetState , onSearchUser, onOpenProfile }: ChatMenuProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('사원'); // '사원' 또는 '채팅방'

  const debouncedSearchTerm = useDebounce(searchTerm, 300); // 300ms 지연, 컴포넌트가 자주 업데이트되지 않도록 제어

  const {data: searchedUsers,isLoading: isSearching} = useQuery({
    queryKey: ['searchChatUsers', debouncedSearchTerm],
    queryFn: () => onSearchUser(debouncedSearchTerm),
    enabled: !!debouncedSearchTerm.trim(),
  });

  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    user: null,
    position: { top: 0, left: 0 },
  });
  const [myState, setMyState] = useState<ModalState>({
    isOpen: false,
    user: null,
    position: { top: 0, left: 0 },
  });

  const handleUserClick = (user: chatProfile, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation(); // 이벤트가 부모로 전파되는 것을 막습니다.
    const rect = event.currentTarget.getBoundingClientRect();
    setModalState({
      isOpen: true,
      user: user,
      position: {
        top: rect.top,
        left: rect.right + 10,
      },
    });
  };

  const handleCloseModal = () => {
    setModalState({ isOpen: false, user: null, position: { top: 0, left: 0 } });
  };
  
  const handleStartChat = (user: chatProfile) => {
    onUserClick(user);
  };

  const handleViewProfile = (user: chatProfile) => {
    onOpenProfile(user);
  };

  const handleSetState = (event: React.MouseEvent<HTMLButtonElement>) =>{
    event.preventDefault();
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setMyState({
      isOpen: true,
      user: myProfile,
      position: {
        top: rect.bottom + 8,
        left: rect.left - (rect.width / 2),
      },
    });
  }
  const handlecloseSetModal = () => {
    setMyState({ isOpen: false, user: null, position: { top: 0, left: 0 } });
  };
  
  const favoriteNoSet = new Set(favoriteUsers.map(fav => fav.userNo));
  return (
    <div className="flex flex-col h-full">
      {/* 최상단 헤더 영역 */}
      <div className="flex justify-between items-center p-2 bg-white border-b">
        <div className="flex justify-between items-center space-x-2 w-full">
          <div className="flex items-center space-x-2">
            <img 
            onClick={() => handleViewProfile(myProfile)}
            src={`${import.meta.env.VITE_API_BASE_URL}/images/${myProfile.profile.imageCode}/${myProfile.profile.changeName}`} className="size-14 bg-gray-300 rounded-xl flex-shrink-0"/>
            <span className="text-gray-800 font-bold">{myProfile.status}</span>
            <button
            onClick={(e) => handleSetState(e)}
            >▼</button>
          </div>
          <div>
            <button className="shadow-lg outline outline-black/5 dark:bg-slate-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10
            hover:bg-gray-200
            " onClick={()=>onMakeChatRoomClick()}>새 채팅</button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
        </div>
      </div>

      {/* 탭 네비게이션 영역 */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('사원')}
          className={`flex-1 p-3 text-center ${activeTab === '사원' ? 'border-b-2 border-blue-500 font-bold' : 'text-gray-500'}`}
        >
          사원
        </button>
        <button
          onClick={() => setActiveTab('채팅방')}
          className={`flex-1 p-3 text-center ${activeTab === '채팅방' ? 'border-b-2 border-blue-500 font-bold' : 'text-gray-500'}`}
        >
          채팅방
        </button>
      </div>

      {/* 목록 컨텐츠 영역 */}
      <div className="flex-1 overflow-y-auto p-2">
        {activeTab === '사원' && (

          <div>
            {/* 검색창 영역 */}
            <div className="p-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="사용자 이름을 입력하세요."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 pl-8 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                </span>
              </div>
            </div>
              {debouncedSearchTerm.trim() ? (
              // --- 검색 결과 뷰 ---
              <div>
                <h3 className="font-semibold text-gray-700 py-2">검색 결과</h3>
                {isSearching && <p className="text-center text-gray-500">검색 중...</p>}
                <ul className="space-y-2">
                  {searchedUsers?.map((user) => {
                    const isFavorite = favoriteNoSet.has(user.userNo);
                    const profilePath = import.meta.env.VITE_API_BASE_URL + "/images/" + user.profile.imageCode + "/"+ user.profile.changeName;
                    return(
                      <li 
                        key={user.userNo} 
                        onClick={(e) => handleUserClick(user, e)}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                      >
                        <div className="flex items-center space-x-2">
                          <img src={profilePath} className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0"/>
                          <div>
                            <p className="font-medium">{user.userName}</p>
                            <p className="text-sm text-gray-500">{user.status}</p>
                          </div>
                        </div>
                        <span onClick={(e) => onToggleFavorite(user, e, isFavorite)} className="text-2xl">
                          {isFavorite ? '⭐️' : '✩'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ):(

              <div>
                {/* 즐겨찾기 목록 */}
                <h3 className="font-semibold text-gray-700 py-2">즐겨찾기</h3>
                <ul className="space-y-2">
                  {favoriteUsers.map((user) => (
                    <li 
                      key={`fav-${user.userNo}`} 
                      onClick={(e) => handleUserClick(user, e)}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <img src={`${import.meta.env.VITE_API_BASE_URL}/images/${user.profile.imageCode}/${user.profile.changeName}`} className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0"/>
                        <div>
                          <p className="font-medium">{user.userName}</p>
                          <p className="text-sm text-gray-500">{user.status}</p>
                        </div>
                      </div>
                      <span>⭐️</span>
                    </li>
                  ))}
                </ul>
                {/* 전체 사원 목록 */}
                <h3 className="font-semibold text-gray-700 py-2 mt-4">사원</h3>
                <ul className="space-y-2">
                  {allUsers.map((user) => {
                    const isFavorite = favoriteNoSet.has(user.userNo);
                    return(
                      <li 
                        key={user.userNo} 
                        onClick={(e) => handleUserClick(user, e)}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                      >
                        <div className="flex items-center space-x-2">
                          <img src={`${import.meta.env.VITE_API_BASE_URL}/images/${user.profile.imageCode}/${user.profile.changeName}`} className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0"/>
                          <div>
                            <p className="font-medium">{user.userName}</p>
                            <p className="text-sm text-gray-500">{user.status}</p>
                          </div>
                        </div>
                        <span onClick={(e) => onToggleFavorite(user, e, isFavorite)} className="text-2xl">
                          {isFavorite ? '⭐️' : '✩'}
                        </span>
                      </li>
                    );
                    })
                  }
                </ul>
              </div>)}
            </div>
        )}
        {activeTab === '채팅방' && (
          <ul className="space-y-1">
            {allChatRooms.length > 0 ? (
              allChatRooms.map((room) => (
                <li 
                  key={room.roomId}
                  // 채팅방 클릭 시 ChatManager의 handleOpenChatFromRoom 함수 호출
                  onClick={() => onChatRoomClick(room)}
                  className="flex items-center p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  {/* 프로필 사진 영역 */}
                  <div className="relative flex-shrink-0 mr-3">
                    {/* 1:1 채팅인 경우 상대방 프로필, 그룹채팅은 기본 아이콘 */}
                    {room.roomType === 'PRIVATE' && room.partner ? (
                      <div className="w-10 h-10 bg-gray-300 rounded-full">
                        {/* <img src={room.partner[0].profileImage} alt={room.partner[0].userName} /> */}
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                      </div>
                    )}
                  </div>

                  {/* 채팅방 정보 영역 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                        <p className="font-semibold text-gray-800 truncate flex items-center">
                          {room.roomType === "PRIVATE" ? (
                              <span 
                                  className="flex-shrink-0 px-2 py-1 bg-sky-200 text-gray-800 text-sm rounded-full mr-2"
                              >
                                  개인
                              </span>
                          ) : (
                              <span 
                                  className="flex-shrink-0 px-2 py-1 bg-red-200 text-gray-800 text-sm rounded-full mr-2"
                              >
                                  그룹
                              </span>
                          )}
                          <span>{room.roomName}</span>
                      </p>
                      <p className="text-xs text-gray-400 flex-shrink-0 ml-2">{room.lastMessage?.sentAt && new Date(room.lastMessage.sentAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-500 truncate">{room.lastMessage?.messageText}</p>
                        {room.unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                            {room.unreadCount}
                          </span>
                        )}
                  </div>
                  </div>
                </li>
              ))
            ) : (
              // 채팅방이 없을 경우
              <div className="text-center text-gray-500 p-8">
                <p>참여중인 채팅방이 없습니다.</p>
              </div>
            )}
          </ul>
        )}
      </div>
      {modalState.isOpen && modalState.user && (
        <UserActionModal
          user={modalState.user}
          position={modalState.position}
          onClose={handleCloseModal}
          onStartChat={handleStartChat}
          onViewProfile={handleViewProfile}
        />
      )}
      {myState.isOpen && myProfile && (
        <UserStateModal
          user={myProfile}
          position={myState.position}
          onClose={handlecloseSetModal}
          onSetState={onSetState}
        />
      )}
    </div>
  );
};

export default ChatMenu;