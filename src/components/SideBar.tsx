import { Link } from 'react-router-dom';




const Sidebar = () => {
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
                        <Link to="/members" className="block py-2 px-3 rounded hover:bg-gray-700" style={{ color: "white" }}>인사관리</Link>
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
                        <Link to="/chat" className="block py-2 px-3 rounded hover:bg-gray-700" style={{ color: "white" }}>채팅</Link>
                    </li>
                </ul>
            </nav>
        </div>
    );
};

export default Sidebar;