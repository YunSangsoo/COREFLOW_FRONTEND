import { Route, Routes } from 'react-router-dom'
import './App.css'
import Login from './login/Login'
import MainPage from './mainPage/MainPage'
import { useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { loginSuccess, logout } from './features/authSlice';
import { api } from './api/coreflowApi';
import CompanyPolicyMainAdmin from './pages/company_policy/CompanyPolicyMainAdmin';
import CompanyPolicyMain from './pages/company_policy/CompanyPolicyMain';
<<<<<<< HEAD
import Sidebar from './components/SideBar';
import ChatManager from './components/chat/ChatManager';
import MemberMain from './pages/member/MemberMain';
import CalendarPage from './pages/CalendarPage';
=======
>>>>>>> main

function App() {
    const dispatch = useDispatch();

    useEffect(() => {
        api.post("/auth/refresh")
            .then(res => {
                dispatch(loginSuccess(res.data));
            })
            .catch(err => {
                dispatch(logout(err.data));
            })
    }, [])

    return (
        <div className="container">
<<<<<<< HEAD
            {!isAuthPage && <Sidebar onChatClick={handleToggleChat} />}
=======
>>>>>>> main
            <Routes>
                <Route path="/" element={<MainPage />} />
                <Route path="/auth">
                    <Route path="login" element={<Login />} />
                </Route>
                <Route path="/cpolicies">
                    <Route path="" element={<CompanyPolicyMain/>} />
                    <Route path=":policyNo" element={<CompanyPolicyMain/>} />
                </Route>
                <Route path="/admin/cpolicies">
                    <Route path="" element={<CompanyPolicyMainAdmin/>} />
                    <Route path=":policyNo" element={<CompanyPolicyMainAdmin/>} />
                </Route>
<<<<<<< HEAD
                    <Route path='/members' element={<MemberMain/>}>
                </Route>
                <Route>
                    <Route path='/calendar' element={<CalendarPage/>}/>
                </Route>
=======
>>>>>>> main
            </Routes>
        </div>
    )
}

export default App
