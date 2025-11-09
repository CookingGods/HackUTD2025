import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
//import App from './App.jsx'
import Chatbot from './components/chatbot.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <div >
      <Chatbot />
    </div>
  </StrictMode>,
);