import './App.css'
import { Routes, Route, Navigate } from 'react-router'
import { RootLayout } from './layouts/root'
import { HomePage } from './pages/home'

function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route path="/" element={<Navigate to="/search" />} />
        <Route path="/search" element={<HomePage />} />
      </Route>
    </Routes>
  )
}

export default App
