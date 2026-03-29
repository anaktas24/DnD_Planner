import { useEffect } from 'react'
import { subscribeCampaign, subscribePlayers, subscribeNotes } from '../lib/firestore'
import { useCampaignStore } from '../store/useCampaignStore'

export function useFirestore() {
  const { setCampaign, setPlayers, setNotes } = useCampaignStore()

  useEffect(() => {
    const unsubs = [
      subscribeCampaign(setCampaign),
      subscribePlayers(setPlayers),
      subscribeNotes(setNotes),
    ]
    return () => unsubs.forEach((u) => u())
  }, [setCampaign, setPlayers, setNotes])
}
