import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './context/AuthContext'
import { NetworkProvider } from './context/NetworkContext'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <NetworkProvider>
        <App />
      </NetworkProvider>
    </AuthProvider>
  </StrictMode>,
)
