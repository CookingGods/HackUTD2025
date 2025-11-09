import './App.css'
import Home from "./pages/Home.jsx";
import Topic from "./pages/Topic.jsx";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/topics/:topicName" element={<Topic />} />
      </Routes>
    </Router>
  );
}

export default App;
