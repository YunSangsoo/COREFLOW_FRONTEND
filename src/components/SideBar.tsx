import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { selectTotalUnreadCount } from '../features/chatSlice';


// onChatClick 함수를 props로 받도록 인터페이스를 정의합니다.
interface SidebarProps {
  onChatClick: () => void;
}

const Sidebar = ({ onChatClick }: SidebarProps) => {
    const [isApprovalOpen, setIsApprovalOpen] = useState(false);
    const totalUnreadCount = useSelector(selectTotalUnreadCount);
    return (
        <div className="fixed left-0 flex flex-col w-56 bg-gray-800 text-white min-h-screen">
            <div className="p-4 bg-gray-900 text-center font-bold text-lg">
                CoreFlow
            </div>
            
            {/* 메뉴 목록 */}
            <nav className="flex-1">
                <ul className="space-y-2 py-4">
                    <li className="px-4">
                        <Link to="/" className="block py-2 px-3 rounded hover:bg-gray-700" style={{ color: "white" }}>홈</Link>
                    </li>
                    <li className="px-4">
                        <button type='button' onClick={() => setIsApprovalOpen(!isApprovalOpen)}
                            style={{ backgroundColor:"#1e2939", padding:"10px"}}
                            className="block w-full text-left py-2 px-3 rounded hover:bg-gray-700 text-white">
                            인사관리
                        </button>
                        {isApprovalOpen && (
                            <ul className="ml-4 mt-2 space-y-1 text-sm">
                                <li>
                                    <Link to="/members" className="block py-2 px-3 rounded hover:bg-gray-600" style={{ color: "white" }}>사원관리</Link>
                                </li>
                                <li>
                                    <Link to="/vacation/personal" className="block py-2 px-3 rounded hover:bg-gray-600" style={{ color: "white" }}>휴가관리</Link>
                                </li>
                                <li>
                                    <Link to="/attendance/personal" className="block py-2 px-3 rounded hover:bg-gray-600" style={{ color: "white" }}>근태관리</Link>
                                </li>
                            </ul>
                        )}
                    </li>
                    <li className="px-4">
                        <Link to="/" className="block py-2 px-3 rounded hover:bg-gray-700" style={{ color: "white" }}>전자결제</Link>
                    </li>
                    <li className="px-4">
                        <Link to="/" className="block py-2 px-3 rounded hover:bg-gray-700" style={{ color: "white" }}>캘린더</Link>
                    </li>
                    <li className="px-4">
                        <Link to="/cpolicies" className="block py-2 px-3 rounded hover:bg-gray-700" style={{ color: "white" }}>회사 규정</Link>
                    </li>
                    <li className="px-4">
                        <Link to="/" className="block py-2 px-3 rounded hover:bg-gray-700" style={{ color: "white" }}>공지</Link>
                    </li>
                    <li className="px-4">
                        <div onClick={onChatClick} className="block py-2 px-3 rounded hover:bg-gray-700 cursor-pointer" style={{ color: "white" }}>
                            채팅
                            {totalUnreadCount > 0 && (
                                <span className="w-2 h-2 float-right bg-red-500 rounded-full"></span>
                            )}
                        </div>
                    </li>
                </ul>
            </nav>
        </div>
    );
};

export default Sidebar;