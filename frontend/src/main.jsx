import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    // StrictMode might cause double invocation in dev, careful with socket.io
    // But for production readiness, let's keep it or comment out if double socket connect issues arise.
    // <React.StrictMode>
    <App />
    // </React.StrictMode>,
)
