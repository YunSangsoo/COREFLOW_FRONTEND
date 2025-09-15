import type { chatProfile } from "../../types/chat";

interface ProfileWindowProps {
  user: chatProfile;
  onStartChat: (user: chatProfile) => void;
}



export const ProfileWindow = ({ user, onStartChat }: ProfileWindowProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 bg-gray-50">
      <div className="w-full max-w-sm mx-auto text-center space-y-6">
        
        {/* 프로필 이미지 */}
        <div className="w-24 h-24 bg-gray-200 rounded-lg mx-auto flex items-center justify-center">
          {/* 이미지가 없을 경우를 대비한 기본 아이콘 */}
          <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-800">{user.userName}</h2>

        <div className="text-left grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="font-semibold text-gray-500">부서</dt>
          <dd className="text-gray-800">개발부</dd>

          <dt className="font-semibold text-gray-500">직급</dt>
          <dd className="text-gray-800">사원</dd>

          <dt className="font-semibold text-gray-500">이메일</dt>
          <dd className="text-gray-800 underline cursor-pointer">{user.email}</dd>

          <dt className="font-semibold text-gray-500">연락처</dt>
          <dd className="text-gray-800">{user.phone}</dd>
        </div>

        {/* 채팅하기 버튼 */}
        <button
          onClick={() => onStartChat(user)}
          className="w-full px-6 py-2 mt-4 text-base font-semibold text-gray-700 bg-white rounded-full shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
        >
          채팅하기
        </button>
      </div>
    </div>
  );
};