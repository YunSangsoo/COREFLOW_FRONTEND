import { Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import Login from './pages/login/Login';
import MainPage from './mainPage/MainPage'
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { loginSuccess, logout } from './features/authSlice';
import { api } from './api/coreflowApi';
import FindPwd from './pages/login/Find-pwd'
import CompanyPolicyMainAdmin from './pages/company_policy/CompanyPolicyMainAdmin';
import CompanyPolicyMain from './pages/company_policy/CompanyPolicyMain';
import Mypage from './pages/mypage/Mypage';
import Sidebar from './components/SideBar';
import ChatManager from './components/chat/ChatManager';
import MemberMain from './pages/member_main/MemberMain';
import VacationInfo from './pages/member_vacation/VacationInfo';
import VacationMember from './pages/member_vacation/VacationMember';
import VacationPersonal from './pages/member_vacation/VacationPersonal';
import DocumentTable from './components/Approval/DocumentTable';
import ApprovalForm from './components/Approval/ApprovalForm';
import DocumentDetailPage from './components/Approval/DocumentDetailPage';
import ReceivedDocumentTable from './components/Approval/ReceivedDocumentTable';
import ProcessedDocumentTable from './components/Approval/ProcessedDocumentTable';
import CcDocumentTable from './components/Approval/CcDocumentTable';
import AttendanceMember from './pages/member_attendance/AttendanceMember';
import AttendancePersonal from './pages/member_attendance/AttendancePersonal';
import type { RootState } from './store/store';
import { connectWebSocket, disconnectWebSocket } from './api/webSocketApi';
import Organization from './pages/member_organization/Organization';
import ProtectedRoute from './components/ProtectedRoute';
import Unauthorized from './components/Unauthorized';
import CalendarPage from './pages/calendar/CalendarPage';
import RoomsPage from './pages/rooms/RoomsPage';
import NoticeMain from './components/notice/NoticeMain';

function App() {
    const dispatch = useDispatch();
    const location = useLocation();
    const isAuthPage = location.pathname.startsWith('/auth');
    const isMainPage = location.pathname === '/';
    
    useEffect(() => {
        api.post("/auth/refresh")
            .then(res => {
                dispatch(loginSuccess(res.data));
            })
            .catch(err => {
                dispatch(logout(err.data));
            })
    }, [dispatch])


    const auth = useSelector((state: RootState) => state.auth);
    useEffect(() => {
        if (auth.accessToken) {
            console.log("Attempting to connect WebSocket...");
            connectWebSocket();
        } else {
            console.log("Disconnecting WebSocket...");
            disconnectWebSocket();
        }

        return () => {
            disconnectWebSocket();
        }
    }, [auth.accessToken]);

    //어떤 페이지에서든 채팅을 구현하기 위해 App페이지에서 변수를 관리함
    const [isChatOpen, setIsChatOpen] = useState(false);
    const handleToggleChat = () => {
        if (auth.accessToken) {
            setIsChatOpen(!isChatOpen);
        } else {
            console.error("채팅 기능은 로그인이 필요합니다.");
            alert("채팅을 이용하려면 먼저 로그인해주세요.");
        }
    };

    const [isNoticeOpen, setIsNoticeOpen] = useState(false);
    const handleToggleNotice = () => {
        if (auth.accessToken) {
            setIsNoticeOpen(!isNoticeOpen);
        } else {
            console.error("공지 기능은 로그인이 필요합니다.");
            alert("공지를 이용하려면 먼저 로그인해주세요.");
        }
    };

    return (
        <>
            <div className="container">
                {!isMainPage && !isAuthPage &&
                    <>
                        <div className='w-56 shrink-0'>
                            <Sidebar onNoticeClick={handleToggleNotice} onChatClick={handleToggleChat} />
                        </div>
                    </>
                }
                <div>
                    <Routes>
                        <Route path="/" element={<MainPage onChatClick={handleToggleChat} />} />
                        <Route path="/auth">
                            <Route path="login" element={<Login />} />
                            <Route path="find-pwd" element={<FindPwd />} />
                        </Route>
                        <Route path="/mypage" element={<Mypage />} />
                        <Route path="/cpolicies">
                            <Route path="" element={<CompanyPolicyMain />} />
                            <Route path=":policyNo" element={<CompanyPolicyMain />} />
                        </Route>
                        <Route path="/admin/cpolicies">
                            <Route path="" element={<CompanyPolicyMainAdmin />} />
                            <Route path=":policyNo" element={<CompanyPolicyMainAdmin />} />
                        </Route>
                        <Route>
                            <Route path='/calendar' element={<CalendarPage />} />
                            <Route path='/rooms' element={<RoomsPage />} />
                        </Route>
                        <Route path='/members' element={
                            <ProtectedRoute>
                                <MemberMain />
                            </ProtectedRoute>
                        } />
                        <Route path='/vacation'>
                            <Route path='info' element={<VacationInfo />} />
                            <Route path='member' element={
                                <ProtectedRoute requiredRoles={['ROLE_ADMIN', 'ROLE_HR']}>
                                    <VacationMember />
                                </ProtectedRoute>
                            } />
                            <Route path='personal' element={<VacationPersonal />} />
                        </Route>
                        <Route path='/attendance'>
                            <Route path="member" element={
                                <ProtectedRoute requiredRoles={['ROLE_ADMIN', 'ROLE_HR']}>
                                    <AttendanceMember/>
                                </ProtectedRoute>
                            } />
                            <Route path="personal" element={<AttendancePersonal />} />
                        </Route>
                        <Route path="/organization" element={<Organization />} />
                        <Route path='/approvals'>
                            <Route path="my-documents" element={<DocumentTable />} />
                            <Route path="received" element={<ReceivedDocumentTable />} />
                            <Route path="processed" element={<ProcessedDocumentTable />} />
                            <Route path="new" element={<ApprovalForm />} />
                            <Route path=":id" element={<DocumentDetailPage />} />
                            <Route path='cc-documents' element={<CcDocumentTable />} />
                        </Route>
                        <Route path='/unAuthorized' element={<Unauthorized />} />
                    </Routes>

                    {isNoticeOpen && <NoticeMain onClose={handleToggleNotice} />}
                    {/* isChatOpen 상태가 true일 때만 ChatManager를 렌더링 */}
                    {isChatOpen && <ChatManager onClose={handleToggleChat} />}
                </div>
            </div>
        </>
    )
}

export default App