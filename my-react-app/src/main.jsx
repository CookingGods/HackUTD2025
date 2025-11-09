import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Map from './components/map.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <div style={{width: "1000px", height: "1000px"}}>
      <Map />
    </div>
    
  </StrictMode>,
)
