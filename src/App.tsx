import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from './lib/firebase'
import { useFirestore } from './hooks/useFirestore'
import { useCampaignStore } from './store/useCampaignStore'
import { updateCampaign } from './lib/firestore'
import { CampaignHeader } from './components/CampaignHeader'
import { PlayerRoster } from './components/PlayerRoster'
import { Calendar } from './components/Calendar'
import { JoinScreen } from './components/JoinScreen'
import { BlogPage } from './components/BlogPage'
import { AdminPanel } from './components/AdminPanel'

const PLAYER_ID_KEY = 'dnd_player_id'
type View = 'home' | 'blog' | 'admin'

export default function App() {
  useFirestore()

  const [ready, setReady] = useState(false)
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [rosterOpen, setRosterOpen] = useState(false)
  const [currentView, setCurrentView] = useState<View>('home')

  const { setActivePlayer, campaign, players } = useCampaignStore()

  // Firebase Auth — drives everything
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user)
      if (user) {
        // Check if this Google user already has a player doc
        const snap = await getDoc(doc(db, 'campaigns', 'main', 'players', user.uid))
        if (snap.exists()) {
          localStorage.setItem(PLAYER_ID_KEY, user.uid)
          setPlayerId(user.uid)
          setActivePlayer(user.uid)
        } else {
          setPlayerId(null) // needs character creation
        }
      } else {
        localStorage.removeItem(PLAYER_ID_KEY)
        setPlayerId(null)
      }
      setReady(true)
    })
    return () => unsub()
  }, [setActivePlayer])

  // Ensure campaign doc exists
  useEffect(() => {
    getDoc(doc(db, 'campaigns', 'main')).then((snap) => {
      if (!snap.exists()) {
        updateCampaign({
          id: 'main',
          name: 'Our Campaign',
          dmName: '',
          sessionCount: 0,
          nextSessionDate: null,
          createdAt: new Date().toISOString(),
        })
      }
    }).catch(() => {})
  }, [])

  function handleJoined(id: string) {
    localStorage.setItem(PLAYER_ID_KEY, id)
    setPlayerId(id)
    setActivePlayer(id)
  }

  // If this player was kicked, send back to join screen
  useEffect(() => {
    if (!playerId || players.length === 0) return
    const stillExists = players.some((p) => p.id === playerId)
    if (!stillExists) {
      localStorage.removeItem(PLAYER_ID_KEY)
      setPlayerId(null)
    }
  }, [players, playerId])

  if (!ready) {
    return (
      <div className="min-h-screen bg-dungeon-900 flex flex-col items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-4">
          <img src="/icons/icon-512.png" alt="Quest Board" className="w-24 h-24 rounded-2xl shadow-2xl" />
          <h1 className="text-3xl font-bold text-amber-400 tracking-wide" style={{ fontFamily: 'Cinzel Decorative, serif' }}>
            DnD Planner
          </h1>
          <p className="text-stone-600 text-sm" style={{ fontFamily: 'Cinzel, serif' }}>
            Session Planner
          </p>
        </div>
        <div className="flex gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-600 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-amber-600 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-amber-600 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    )
  }

  if (!firebaseUser || !playerId) {
    return <JoinScreen firebaseUser={firebaseUser} onJoined={handleJoined} />
  }

  return (
    <div className="min-h-screen flex flex-col bg-dungeon-900">
      <CampaignHeader
        onMenuClick={() => setRosterOpen(true)}
        onNavigate={setCurrentView}
      />

      {campaign?.pinnedAnnouncement && (
        <div className="bg-amber-900/30 border-b border-amber-700/50 px-4 py-2 text-amber-300 text-sm text-center">
          📌 {campaign.pinnedAnnouncement}
        </div>
      )}

      {campaign?.sessionLocation && campaign?.nextSessionDate && (
        <div className="bg-dungeon-800 border-b border-amber-900/30 px-4 py-1.5 text-stone-400 text-xs text-center">
          📍 Session location: <span className="text-stone-300 font-medium">{campaign.sessionLocation}</span>
        </div>
      )}

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {currentView === 'home' && (
          <>
            <div className="hidden md:block">
              <PlayerRoster />
            </div>
            {rosterOpen && (
              <div className="fixed inset-0 z-40 md:hidden flex">
                <div className="absolute inset-0 bg-black/60" onClick={() => setRosterOpen(false)} />
                <div className="relative z-10">
                  <PlayerRoster onClose={() => setRosterOpen(false)} />
                </div>
              </div>
            )}
            <Calendar />
          </>
        )}
        {currentView === 'blog' && <BlogPage />}
        {currentView === 'admin' && <AdminPanel />}
      </div>
    </div>
  )
}
