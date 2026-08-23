import { create } from 'zustand'
import type { Player, Campaign, SessionNote, BlogPost } from '../types'

interface CampaignStore {
  campaign: Campaign | null
  players: Player[]
  notes: SessionNote[]
  blogPosts: BlogPost[]
  activePlayerId: string | null

  setCampaign: (c: Campaign | null) => void
  setPlayers: (p: Player[]) => void
  setNotes: (n: SessionNote[]) => void
  setBlogPosts: (b: BlogPost[]) => void
  setActivePlayer: (id: string | null) => void

  allFreeDates: (month: Date) => string[]
  allGreenDates: () => string[]
  pollWinner: () => string | null
}

export const useCampaignStore = create<CampaignStore>((set, get) => ({
  campaign: null,
  players: [],
  notes: [],
  blogPosts: [],
  activePlayerId: null,

  setCampaign: (campaign) => set({ campaign }),
  setPlayers: (players) => set({ players }),
  setNotes: (notes) => set({ notes }),
  setBlogPosts: (blogPosts) => set({ blogPosts }),
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

  allGreenDates: () => {
    const { players } = get()
    if (players.length === 0) return []
    const sets = players.map((p) => new Set(p.availability))
    const allDates = new Set(players.flatMap((p) => p.availability))
    return [...allDates].filter((date) => sets.every((s) => s.has(date))).sort()
  },

  pollWinner: () => {
    const { campaign, players } = get()
    if (!campaign?.dateVotes) return null
    const votes = campaign.dateVotes
    const totalPlayers = players.length
    if (totalPlayers === 0) return null

    const totalVotesCast = Object.values(votes).reduce((sum, ids) => sum + ids.length, 0)
    if (totalVotesCast < totalPlayers) return null

    let winner: string | null = null
    let maxVotes = 0
    for (const [date, ids] of Object.entries(votes)) {
      if (ids.length > maxVotes || (ids.length === maxVotes && winner && date < winner)) {
        maxVotes = ids.length
        winner = date
      }
    }
    return winner
  },
}))
