import { useEffect, useState } from 'react'
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
  const [playerId, setPlayerId] = useState<string | null>(
    () => localStorage.getItem(PLAYER_ID_KEY)
  )
  const [rosterOpen, setRosterOpen] = useState(false)
  const [currentView, setCurrentView] = useState<View>('home')

  useEffect(() => {
    const timeout = setTimeout(() => setReady(true), 8000)
    import('./lib/firebase').then(({ db }) => {
      import('firebase/firestore').then(({ doc, getDoc }) => {
        getDoc(doc(db, 'campaigns', 'main')).then((snap) => {
          clearTimeout(timeout)
          if (!snap.exists()) {
            updateCampaign({
              id: 'main',
              name: 'Our Campaign',
              dmName: '',
              sessionCount: 0,
              nextSessionDate: null,
              createdAt: new Date().toISOString(),
            }).then(() => setReady(true)).catch(() => setReady(true))
          } else {
            setReady(true)
          }
        }).catch(() => { clearTimeout(timeout); setReady(true) })
      })
    })
    return () => clearTimeout(timeout)
  }, [])

  const { setActivePlayer, campaign, players } = useCampaignStore()

  function handleJoined(id: string) {
    localStorage.setItem(PLAYER_ID_KEY, id)
    setPlayerId(id)
    setActivePlayer(id)
  }

  useEffect(() => {
    if (playerId) setActivePlayer(playerId)
  }, [playerId, setActivePlayer])

  // If this player was kicked, clear their session and show JoinScreen
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

  if (!playerId) {
    return <JoinScreen onJoined={handleJoined} />
  }

  return (
    <div className="min-h-screen flex flex-col bg-dungeon-900">
      <CampaignHeader
        onMenuClick={() => setRosterOpen(true)}
        currentView={currentView}
        onNavigate={setCurrentView}
      />

      {/* Pinned announcement */}
      {campaign?.pinnedAnnouncement && (
        <div className="bg-amber-900/30 border-b border-amber-700/50 px-4 py-2 text-amber-300 text-sm text-center">
          📌 {campaign.pinnedAnnouncement}
        </div>
      )}

      {/* Session location */}
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
