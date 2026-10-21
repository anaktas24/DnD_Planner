import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App'
import { InviteGate } from './components/InviteGate'

// Pick up new deploys without players having to close the app twice:
// check for an update hourly and whenever the app comes back to the foreground,
// and reload automatically once the new version is ready.
registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (!registration) return
    const check = () => registration.update().catch(() => {})
    setInterval(check, 60 * 60 * 1000)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check()
    })
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <InviteGate>
        <App />
      </InviteGate>
    </BrowserRouter>
  </StrictMode>,
)
