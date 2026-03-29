import { create } from 'zustand'
import type { Player, Campaign, SessionNote } from '../types'

interface CampaignStore {
  campaign: Campaign | null
  players: Player[]
  notes: SessionNote[]
  activePlayerId: string | null

  setCampaign: (c: Campaign | null) => void
  setPlayers: (p: Player[]) => void
  setNotes: (n: SessionNote[]) => void
  setActivePlayer: (id: string | null) => void

  // Derived helpers
  allFreeDates: (month: Date) => string[]
}

export const useCampaignStore = create<CampaignStore>((set, get) => ({
  campaign: null,
  players: [],
  notes: [],
  activePlayerId: null,

  setCampaign: (campaign) => set({ campaign }),
  setPlayers: (players) => set({ players }),
  setNotes: (notes) => set({ notes }),
  setActivePlayer: (id) => set({ activePlayerId: id }),

  allFreeDates: (month) => {
    const { players } = get()
    if (players.length === 0) return []
    const sets = players.map((p) => new Set(p.availability))
    const first = sets[0]
    const common: string[] = []
    first.forEach((date) => {
      const d = new Date(date)
      if (
        d.getFullYear() === month.getFullYear() &&
        d.getMonth() === month.getMonth() &&
        sets.every((s) => s.has(date))
      ) {
        common.push(date)
      }
    })
    return common
  },
}))
