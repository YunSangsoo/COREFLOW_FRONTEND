import { Route, Routes } from 'react-router-dom'
import './App.css'
import Login from './login/Login'
import MainPage from './mainPage/MainPage'
import { useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { loginSuccess, logout } from './features/authSlice';
import { api } from './api/coreflowApi';
import FindId from './login/Find-id';
import FindPwd from './login/Find-pwd';

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
  },[])

  return (
    <div className="container">
      <Routes>
        <Route path="/"  element={<MainPage/>}/>
        <Route path="/auth">
          <Route path="login" element={<Login/>}/>
          <Route path="find-id" element={<FindId/>}/>
          <Route path="find-pwd" element={<FindPwd/>}/>
        </Route>
      </Routes>
    </div>
  )
}

export default App
