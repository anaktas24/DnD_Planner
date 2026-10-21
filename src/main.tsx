import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { InviteGate } from './components/InviteGate'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <InviteGate>
        <App />
      </InviteGate>
    </BrowserRouter>
  </StrictMode>,
)
