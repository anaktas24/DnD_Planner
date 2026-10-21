import { useEffect, useState, type ReactNode } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { captureInviteFromUrl, isInviteValid } from '../lib/invite'

type GateState = 'checking' | 'open' | 'closed'

function waitForAuth(): Promise<User | null> {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub()
      resolve(user)
    })
  })
}

async function isExistingMember(user: User | null): Promise<boolean> {
  if (!user) return false
  try {
    const snap = await getDoc(doc(db, 'campaigns', 'main', 'players', user.uid))
    return snap.exists()
  } catch {
    return false
  }
}

export function InviteGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GateState>('checking')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const token = captureInviteFromUrl()
      // Valid invite on this device, or already a member of the campaign
      const open = (token && await isInviteValid(token)) || await isExistingMember(await waitForAuth())
      if (!cancelled) setState(open ? 'open' : 'closed')
    })()
    return () => { cancelled = true }
  }, [])

  if (state === 'checking') return <div className="min-h-screen bg-dungeon-900" />
  if (state === 'closed') return <OutOfOrder />
  return <>{children}</>
}

function OutOfOrder() {
  return (
    <div className="min-h-screen bg-dungeon-900 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        <span className="text-5xl">🔧</span>
        <h1 className="text-2xl font-bold text-stone-300">Currently out of order</h1>
        <p className="text-stone-500 text-sm">
          This app is temporarily unavailable. Please check back later.
        </p>
      </div>
    </div>
  )
}
