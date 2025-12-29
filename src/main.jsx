import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Initialize Office.js if available
if (window.Office) {
  Office.onReady(() => {
    console.log('Office.js ready for Word Automator AI')
  }).catch(error => {
    console.warn('Office.js initialization warning:', error)
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)