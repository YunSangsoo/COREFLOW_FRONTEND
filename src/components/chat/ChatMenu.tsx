import React, { useState } from 'react';

// ChatMenu 컴포넌트가 받을 props의 타입을 정의합니다.
interface ChatMenuProps {
  onUserClick: (userId: string, userName: string) => void;
}

// 예시 데이터 (실제 프로젝트에서는 API를 통해 가져옵니다.)
const favoriteUsers = [
  { id: 'u-1', name: '윤상수', status: '온라인' },
  { id: 'u-2', name: '심은성', status: '온라인' },
  { id: 'u-3', name: '남건후', status: '회의중' },
  { id: 'u-4', name: '고훈', status: '오프라인' },
];

const allUsers = [
  { id: 'u-5', name: '이과장', status: '온라인' },
  { id: 'u-6', name: '성윤지', status: '온라인' },
  { id: 'u-7', name: '박태선', status: '식사중' },
  { id: 'u-8', name: '최혁순', status: '회의중' },
  { id: 'u-9', name: '김영민', status: '오프라인' },
];

const ChatMenu = ({ onUserClick }: ChatMenuProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('사원'); // '사원' 또는 '채팅방'

  return (
    <div className="flex flex-col h-full">
      {/* 최상단 헤더 영역 */}
      <div className="flex justify-between items-center p-2 bg-white border-b">
        <div className="flex items-center space-x-2">
          <span className="text-gray-800 font-bold">온라인 ▼</span>
        </div>
        <div className="flex items-center space-x-2">
          {/* 채팅 아이콘 */}
          <button className="text-gray-500 hover:text-gray-800">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.766v4.249a.75.75 0 0 0 .75.75h18a.75.75 0 0 0 .75-.75v-4.249m-19.5 0A2.25 2.25 0 0 1 5.25 10.5h13.5a2.25 2.25 0 0 1 2.25 2.25v2.25a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15v-2.25Z" />
            </svg>
          </button>
          {/* 설정 아이콘 */}
          <button className="text-gray-500 hover:text-gray-800">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </button>
        </div>
      </div>
      
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
            {/* 즐겨찾기 목록 */}
            <h3 className="font-semibold text-gray-700 py-2">즐겨찾기 ▼</h3>
            <ul className="space-y-2">
              {favoriteUsers.map((user) => (
                <li 
                  key={user.id} 
                  onClick={() => onUserClick(user.id, user.name)}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0"></div>
                    <div>
                      <p className="font-medium">{user.name}</p>
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
              {allUsers.map((user) => (
                <li 
                  key={user.id} 
                  onClick={() => onUserClick(user.id, user.name)}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0"></div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.status}</p>
                    </div>
                  </div>
                  <span>✩</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 채팅방 목록 (추후 구현) */}
        {activeTab === '채팅방' && (
          <div className="text-center text-gray-500 p-4">
            <p>채팅방 목록이 여기에 표시됩니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMenu;