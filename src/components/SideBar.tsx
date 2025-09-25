import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { selectTotalUnreadCount } from '../features/chatSlice';
import Header from './Header';
import { api } from '../api/coreflowApi';
import type { RootState } from '../store/store';
import { logout } from '../features/authSlice';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import type { LoginUser } from '../types/vacation';
import { loginUser } from '../api/vacationApi';
import type { Attendance } from '../types/attendance';
import { loginUserAttendance } from '../api/attendanceApi';


// onChatClick 함수를 props로 받도록 인터페이스를 정의합니다.
interface SidebarProps {
    onChatClick: () => void;
}

const Sidebar = ({ onChatClick }: SidebarProps) => {
    const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
    const [isApprovalOpen, setIsApprovalOpen] = useState(false);
    const totalUnreadCount = useSelector(selectTotalUnreadCount);

    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Redux store에서 현재 인증 상태와 사용자 정보를 가져옵니다.
    const auth = useSelector((state: RootState) => state.auth);

    // 로그아웃 핸들러
    const handleLogout = async () => {
        try {
            // 백엔드에 로그아웃 요청을 보냅니다 (세션/토큰 무효화).
            await api.post('/auth/logout');
        } catch (error) {
            console.error("Logout failed", error);
        } finally {
            // API 요청 성공 여부와 관계없이 프론트엔드에서는 로그아웃 처리
            dispatch(logout());
            navigate('/auth/login'); // 로그인 페이지로 리디렉션
        }
    };



    // 출퇴근 기록용 날짜 상태
    const [selectYear, setSelectYear] = useState(dayjs().year());
    const [selectMonth, setSelectMonth] = useState(dayjs().month() + 1);

    // 출퇴근 기록용 로그인 사용자 정보
    const { data: loginUserProfile } = useQuery<LoginUser>({
        queryKey: ['userProfile'],
        queryFn: () => loginUser()
    })

    // 출퇴근 기록용 로그인 사용자 근태 정보
    const { data: loginUserAtt } = useQuery<Attendance[]>({
        queryKey: ['loginUserAtt', selectYear, selectMonth],
        queryFn: () => loginUserAttendance(selectYear, selectMonth)
    });

    return (
        <div className="fixed top-0 left-0 flex flex-col w-56 bg-gray-800 text-white h-screen">
            <div className="p-4 bg-gray-900 text-center font-bold text-lg">
                CoreFlow
            </div>

            {/* 메뉴 목록 */}
            <nav className="flex-1">
                <ul className="space-y-2 py-4">
                    {auth.accessToken && auth.user ? (
                        <ul>
                            <div className="px-4">
                                <li className="block w-full text-left py-2 px-3 rounded text-white">
                                    {auth.user.userName}
                                </li>
                                <li className="block w-full text-left py-2 px-3 rounded hover:bg-gray-700 text-white">
                                    마이페이지
                                </li>
                            </div>
                            <div className="pt-1 -mb-[1px] px-2.5">
                                <li className="flex justify-around w-full">
                                    <button type="button" className="w-1/3 text-left py-2 px-3 rounded bg-blue-500 hover:bg-blue-400 text-white">
                                        출근
                                    </button>
                                    <button type="button" className="w-1/2 text-left py-2 px-3 rounded bg-red-500 hover:bg-red-400 text-white">
                                        로그아웃
                                    </button>
                                </li>
                            </div>
                        </ul>
                    ) : (
                        <li>
                            로그인
                        </li>
                    )}
                    <li className="px-4">
                        <Link to="/" className="block py-2 px-3 rounded hover:bg-gray-700" style={{ color: "white" }}>홈</Link>
                    </li>
                    <li className="px-4">
                        <button type='button' onClick={() => setIsAttendanceOpen(!isAttendanceOpen)}
                            style={{ backgroundColor: "#1e2939", padding: "10px" }}
                            className="block w-full text-left py-2 px-3 rounded hover:bg-gray-700 text-white">
                            인사관리
                        </button>
                        {isAttendanceOpen && (
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
                                <li>
                                    <Link to="/organization" className="block py-2 px-3 rounded hover:bg-gray-600" style={{ color: "white" }}>조직도</Link>
                                </li>
                            </ul>
                        )}
                    </li>
                    <li className="px-4">
                        <button type="button" onClick={() => setIsApprovalOpen(!isApprovalOpen)}
                            style={{ backgroundColor: "#1e2939", padding: "10px" }}
                            className="block w-full text-left py-2 px-3 rounded hover:bg-gray-700 text-white">
                            전자결재
                        </button>
                        {isApprovalOpen && (
                            <ul className="ml-4 mt-2 space-y-1 text-sm">
                                <li>
                                    <Link to="/approvals/my-documents" className="block py-1 px-2 rounded hover:bg-gray-600"
                                        style={{ color: "white" }}>
                                        작성문서목록
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/approvals/new" className="block py-1 px-2 rounded hover:bg-gray-600"
                                        style={{ color: "white" }}>
                                        문서 작성
                                    </Link>
                                </li>
                                <li>
                                    <Link to="approvals/received" className="block py-1 px-2 rounded hover:bg-gray-600"
                                        style={{ color: "white" }}>
                                        받은 문서함
                                    </Link>
                                </li>
                                <li>
                                    <Link to="approvals/processed" className="block py-1 px-2 rounded hover:bg-gray-600"
                                        style={{ color: "white" }}>
                                        결재 완료함
                                    </Link>
                                </li>
                                <li>
                                    <Link to="approvals/cc-documents" className="block py-1 px-2 rounded hover:bg-gray-600"
                                        style={{ color: "white" }}>
                                        참조문서함
                                    </Link>
                                </li>
                            </ul>
                        )}
                    </li>
                    <li className="px-4">
                        <Link to="/calendar" className="block py-2 px-3 rounded hover:bg-gray-700" style={{ color: "white" }}>캘린더</Link>
                    </li>
                    <li className="px-4">
                        <Link to="/rooms" className="block py-2 px-3 rounded hover:bg-gray-700" style={{ color: "white" }}>회의실</Link>
                    </li>
                    <li className="px-4">
                        <Link to="/cpolicies" className="block py-2 px-3 rounded hover:bg-gray-700" style={{ color: "white" }}>회사 규정</Link>
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