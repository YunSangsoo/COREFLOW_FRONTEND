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
import CalendarPage from './pages/CalendarPage';

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
                </Route>
                <Route path="/cpolicies">
                    <Route path="" element={<CompanyPolicyMain/>} />
                    <Route path=":policyNo" element={<CompanyPolicyMain/>} />
                </Route>
                <Route path="/admin/cpolicies">
                    <Route path="" element={<CompanyPolicyMainAdmin/>} />
                    <Route path=":policyNo" element={<CompanyPolicyMainAdmin/>} />
                </Route>
                <Route>
                    <Route path='/calendar' element={<CalendarPage/>}/>
                </Route>
            </Routes>
        </div>
    )
}

export default App
