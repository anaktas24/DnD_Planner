import { useEffect, useState } from 'react'
import { useFirestore } from './hooks/useFirestore'
import { useCampaignStore } from './store/useCampaignStore'
import { updateCampaign } from './lib/firestore'
import { CampaignHeader } from './components/CampaignHeader'
import { PlayerRoster } from './components/PlayerRoster'
import { Calendar } from './components/Calendar'
import { JoinScreen } from './components/JoinScreen'
import { MapPage } from './components/MapPage'

const PLAYER_ID_KEY = 'dnd_player_id'

export default function App() {
  useFirestore()

  const [ready, setReady] = useState(false)
  const [playerId, setPlayerId] = useState<string | null>(
    () => localStorage.getItem(PLAYER_ID_KEY)
  )
  const [rosterOpen, setRosterOpen] = useState(false)
  const [currentView, setCurrentView] = useState<'home' | 'map'>('home')

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

  const { setActivePlayer } = useCampaignStore()

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
        onMapClick={() => setCurrentView((v) => v === 'map' ? 'home' : 'map')}
        currentView={currentView}
      />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {currentView === 'home' ? (
          <>
            {/* Desktop sidebar */}
            <div className="hidden md:block">
              <PlayerRoster />
            </div>

            {/* Mobile drawer */}
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
        ) : (
          <MapPage onBack={() => setCurrentView('home')} />
        )}
      </div>
    </div>
  )
}
