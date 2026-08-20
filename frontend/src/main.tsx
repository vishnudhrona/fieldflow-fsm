import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { AuthProvider } from './context/AuthContext'
import { NetworkProvider } from './context/NetworkContext'
import { SyncProvider } from './context/SyncContext'
import './index.css'
import App from './App.tsx'

registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <NetworkProvider>
        <SyncProvider>
          <App />
        </SyncProvider>
      </NetworkProvider>
    </AuthProvider>
  </StrictMode>,
)

