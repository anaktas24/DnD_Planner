export interface Player {
  id: string
  name: string
  characterName: string
  characterClass: string
  characterRace: string
  color: string
  availability: string[] // ISO date strings "YYYY-MM-DD"
  confirmedDates: string[]
  declinedDates: string[]
}

export interface SessionNote {
  id: string
  date: string
  sessionNumber: number
  summary: string
  location: string
  nextLocation: string
}

export type Role = 'admin' | 'editor' | 'player'

export interface ArcEntry {
  name: string
  startedAt: string // ISO date string
}

export interface Campaign {
  id: string
  name: string
  dmName: string
  arcHistory: ArcEntry[] // past arc names, newest last
  sessionCount: number
  nextSessionDate: string | null
  nextSessionTime: string | null
  sessionLocation: string | null
  createdAt: string
  dateVotes: Record<string, string[]>
  timeVotes: Record<string, string[]>
  roles: Record<string, Role> // playerId -> role
  pinnedAnnouncement: string | null
  discordWebhookUrl?: string
  discordDateNotified?: boolean
  discordTimeNotified?: boolean

}

export interface Notification {
  id: string
  message: string
  createdAt: string
  readBy: string[] // playerIds who have read it
}

export interface BlogPost {
  id: string
  title: string
  content: string
  authorId: string
  authorName: string
  createdAt: string
  updatedAt: string
}
