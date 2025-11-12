import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { performanceMonitor } from './lib/performanceMonitor'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Log performance summary in development
if (import.meta.env.DEV) {
  // Log initial performance after 2 seconds
  setTimeout(() => {
    performanceMonitor.logSummary()
  }, 2000)
  
  // Log performance every 30 seconds
  setInterval(() => {
    performanceMonitor.logSummary()
  }, 30000)
}
