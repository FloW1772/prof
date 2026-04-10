import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import HomePage from './pages/HomePage'
import Learn from './pages/Learn'
import Flashcards from './pages/Flashcards'

function LearnRoute() {
  const location = useLocation()
  const restoreKey = location.key || 'fresh'

  return <Learn key={restoreKey} />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/learn" element={<LearnRoute />} />
          <Route path="/flashcards" element={<Flashcards />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
