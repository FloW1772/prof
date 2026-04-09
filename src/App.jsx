import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import HomePage from './pages/HomePage'
import Learn from './pages/Learn'
import Flashcards from './pages/Flashcards'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/flashcards" element={<Flashcards />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
