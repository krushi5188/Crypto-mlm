import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

// Pages will be created one by one
import LandingPage from './pages/LandingPage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
      </Routes>
    </Router>
  )
}

export default App
