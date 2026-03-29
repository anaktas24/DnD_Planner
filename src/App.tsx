import { useFirestore } from './hooks/useFirestore'
import { useCampaignStore } from './store/useCampaignStore'
import { CampaignHeader } from './components/CampaignHeader'
import { PlayerRoster } from './components/PlayerRoster'
import { Calendar } from './components/Calendar'
import { SetupScreen } from './components/SetupScreen'

export default function App() {
  useFirestore()
  const campaign = useCampaignStore((s) => s.campaign)

  // campaign is null while loading; undefined-ish means not set up yet
  // We treat campaign === null as "still loading" and show nothing briefly
  if (campaign === null) {
    return (
      <div className="min-h-screen bg-dungeon-900 flex items-center justify-center">
        <p className="text-stone-600 text-sm animate-pulse">Loading...</p>
      </div>
    )
  }

  // Check if campaign has been initialized (has a name)
  if (!campaign.name) {
    return <SetupScreen />
  }

  return (
    <div className="min-h-screen flex flex-col bg-dungeon-900">
      <CampaignHeader />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <PlayerRoster />
        <Calendar />
      </div>
    </div>
  )
}
