import { Route, Routes } from 'react-router-dom'
import './App.css'
import Login from './login/login'

function App() {

  return (
    <div className="container">
      <Routes>
        <Route path="/login" element={<Login/>}/>
      </Routes>
    </div>
  )
}

export default App
