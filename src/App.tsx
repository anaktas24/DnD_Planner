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
    import('./lib/firebase').then(({ db }) => {
      import('firebase/firestore').then(({ doc, getDoc }) => {
        getDoc(doc(db, 'campaigns', 'main')).then((snap) => {
          if (!snap.exists()) {
            updateCampaign({
              id: 'main',
              name: 'Our Campaign',
              dmName: '',
              sessionCount: 0,
              nextSessionDate: null,
              createdAt: new Date().toISOString(),
            }).then(() => setReady(true))
          } else {
            setReady(true)
          }
        })
      })
    })
  }, [])

  const { setActivePlayer, campaign } = useCampaignStore()

  function handleJoined(id: string) {
    localStorage.setItem(PLAYER_ID_KEY, id)
    setPlayerId(id)
    setActivePlayer(id)
  }

  useEffect(() => {
    if (playerId) setActivePlayer(playerId)
  }, [playerId, setActivePlayer])

  if (!ready) {
    return (
      <div className="min-h-screen bg-dungeon-900 flex items-center justify-center">
        <p className="text-stone-600 text-sm animate-pulse">Loading...</p>
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
