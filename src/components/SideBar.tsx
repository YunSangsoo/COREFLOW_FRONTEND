import { useState } from 'react';
import { Link } from 'react-router-dom';


// onChatClick 함수를 props로 받도록 인터페이스를 정의합니다.
interface SidebarProps {
  onChatClick: () => void;
}

const Sidebar = ({ onChatClick }: SidebarProps) => {
    const [isApprovalOpen, setIsApprovalOpen] = useState(false);
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
                                    <Link to="/vacation/info" className="block py-2 px-3 rounded hover:bg-gray-600" style={{ color: "white" }}>연차관리</Link>
                                </li>
                                <li>
                                    <Link to="/attendance" className="block py-2 px-3 rounded hover:bg-gray-600" style={{ color: "white" }}>출결관리</Link>
                                </li>
                            </ul>
                        )}
                    </li>
                    <li className="px-4">
                        <button type="button" onClick={() => setIsApprovalOpen(!isApprovalOpen)}
                        style={{ backgroundColor:"#1e2939", padding:"10px"}}
                        className="block w-full text-left py-2 px-3 rounded hover:bg-gray-700 text-white">
                        전자결재
                        </button>
                        {isApprovalOpen && (
                            <ul className="ml-4 mt-2 space-y-1 text-sm">
                                <li>
                                    <Link to="/approvals/my-documents" className="block py-1 px-2 rounded hover:bg-gray-600"
                                    style={{ color: "white" }}>
                                        문서목록
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/approvals/new" className="block py-1 px-2 rounded hover:bg-gray-600"
                                    style={{ color: "white" }}>
                                        문서 작성
                                    </Link>
                                </li>
                                <Link to="approvals/temp" className="block py-1 px-2 rounded hover:bg-gray-600"
                                    style={{ color: "white" }}>
                                        임시저장함
                                    </Link>
                                <li>
                                    <Link to="approvals/received" className="block py-1 px-2 rounded hover:bg-gray-600"
                                    style={{ color: "white" }}>
                                        결재 관리
                                    </Link>
                                </li>
                                <li>
                                    <Link to="approvals/processed" className="block py-1 px-2 rounded hover:bg-gray-600"
                                    style={{ color: "white" }}>
                                        결재 완료함
                                    </Link>
                                </li>
                            </ul>
                        )}
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
                        </div>
                    </li>
                </ul>
            </nav>
        </div>
    );
};
export default Sidebar;