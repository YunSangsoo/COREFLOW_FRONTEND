import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import CalendarPage from './pages/CalendarPage'

function App() {

  return (
      <Routes>
        <Route path='/' element={<CalendarPage/>}/>
      </Routes>
    
      
  )
}

export default App
