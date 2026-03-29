export interface Player {
  id: string
  name: string
  characterName: string
  characterClass: string
  color: string
  availability: string[] // ISO date strings "YYYY-MM-DD"
  confirmedDates: string[]
  declinedDates: string[]
}

export interface SessionNote {
  id: string
  date: string // ISO date string
  sessionNumber: number
  summary: string
  location: string
  nextLocation: string
}

export interface Campaign {
  id: string
  name: string
  dmName: string
  sessionCount: number
  nextSessionDate: string | null
  createdAt: string
}
