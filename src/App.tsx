import { Route, Routes } from 'react-router-dom'
import './App.css'
import Login from './login/Login'
import MainPage from './mainPage/MainPage'
import { useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { loginSuccess, logout } from './features/authSlice';
import { api } from './api/coreflowApi';
import FindPwd from './login/Find-pwd';
import CompanyPolicyMainAdmin from './pages/company_policy/CompanyPolicyMainAdmin';
import CompanyPolicyMain from './pages/company_policy/CompanyPolicyMain';
import Mypage from './mypage/Mypage';

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
            </Routes>
        </div>
    )
}

export default App
