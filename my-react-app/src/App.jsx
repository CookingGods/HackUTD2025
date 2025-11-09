import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Home from "./pages/Home.jsx";
import Topic from "./pages/Topic.jsx";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        {/* Home page */}
        <Route path="/" element={<Home />} />

        {/* Topic page with dynamic parameter */}
        <Route path="/topics/:topicName" element={<Topic />} />
      </Routes>
    </Router>
  );
}

export default App;
