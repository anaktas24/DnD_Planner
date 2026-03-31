import { useEffect } from 'react'
import { subscribeCampaign, subscribePlayers, subscribeNotes, subscribeBlog, subscribeNotifications } from '../lib/firestore'
import { useCampaignStore } from '../store/useCampaignStore'

export function useFirestore() {
  const { setCampaign, setPlayers, setNotes, setBlogPosts, setNotifications } = useCampaignStore()

  useEffect(() => {
    const unsubs = [
      subscribeCampaign(setCampaign),
      subscribePlayers(setPlayers),
      subscribeNotes(setNotes),
      subscribeBlog(setBlogPosts),
      subscribeNotifications(setNotifications),
    ]
    return () => unsubs.forEach((u) => u())
  }, [setCampaign, setPlayers, setNotes, setBlogPosts, setNotifications])
}
