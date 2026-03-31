import { useEffect } from 'react'
import { subscribeCampaign, subscribePlayers, subscribeNotes, subscribeBlog } from '../lib/firestore'
import { useCampaignStore } from '../store/useCampaignStore'

export function useFirestore() {
  const { setCampaign, setPlayers, setNotes, setBlogPosts } = useCampaignStore()

  useEffect(() => {
    const unsubs = [
      subscribeCampaign(setCampaign),
      subscribePlayers(setPlayers),
      subscribeNotes(setNotes),
      subscribeBlog(setBlogPosts),
    ]
    return () => unsubs.forEach((u) => u())
  }, [setCampaign, setPlayers, setNotes, setBlogPosts])
}
