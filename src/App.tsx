import { Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import Login from './pages/login/Login';
import MainPage from './mainPage/MainPage'
import { useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import { loginSuccess, logout } from './features/authSlice';
import { api } from './api/coreflowApi';
import FindPwd from './pages/login/Find-pwd'
import CompanyPolicyMainAdmin from './pages/company_policy/CompanyPolicyMainAdmin';
import CompanyPolicyMain from './pages/company_policy/CompanyPolicyMain';
import { getPolicies } from './api/companyPolicyApi';
import Mypage from './pages/mypage/Mypage';
import Sidebar from './components/SideBar';
import ChatManager from './components/chat/ChatManager';
import MemberMain from './pages/member_main/MemberMain';
import VacationInfo from './pages/member_vacation/VacationInfo';
import VacationMember from './pages/member_vacation/VacationMember';
import VacationPersonal from './pages/member_vacation/VacationPersonal';
import Attendance from './pages/member_attendance/Attendance';


function App() {
    const dispatch = useDispatch();
    const location = useLocation();
    const isAuthPage = location.pathname.startsWith('/auth');

    useEffect(() => {
        api.post("/auth/refresh")
            .then(res => {
                dispatch(loginSuccess(res.data));
            })
            .catch(err => {
                dispatch(logout(err.data));
            })
    }, [])

    //어떤 페이지에서든 채팅을 구현하기 위해 App페이지에서 변수를 관리함
    const [isChatOpen, setIsChatOpen] = useState(false);
    const handleToggleChat = () => {
        setIsChatOpen(!isChatOpen);
    };

    return (
        <div className="container">
            {!isAuthPage && <Sidebar onChatClick={handleToggleChat} />}
            <Routes>
                <Route path="/" element={<MainPage />} />
                <Route path="/auth">
                    <Route path="login" element={<Login />} />
                    <Route path="find-pwd" element={<FindPwd/>}/>
                </Route>
                <Route path="/mypage" element={<Mypage/>}/>
                <Route path="/cpolicies">
                    <Route path="" element={<CompanyPolicyMain/>} />
                    <Route path=":policyNo" element={<CompanyPolicyMain/>} />
                </Route>
                <Route path="/admin/cpolicies">
                    <Route path="" element={<CompanyPolicyMainAdmin/>} />
                    <Route path=":policyNo" element={<CompanyPolicyMainAdmin/>} />
                </Route>
                <Route path='/members' element={<MemberMain/>}></Route>
                <Route path='/vacation'>
                    <Route path='info' element={<VacationInfo/>}></Route>
                    <Route path='member' element={<VacationMember/>}></Route>
                    <Route path='member:userNo' element={<VacationPersonal/>}></Route>
                </Route>
                <Route path='/attendance' element={<Attendance/>}>
                </Route>
            </Routes>

            {/* isChatOpen 상태가 true일 때만 ChatManager를 렌더링 */}
            {isChatOpen && <ChatManager onClose={handleToggleChat} />}
        </div>
    )
}

export default App
