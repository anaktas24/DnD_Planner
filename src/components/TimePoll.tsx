import { useEffect } from 'react'
import { format, parseISO, parse } from 'date-fns'
import { Clock } from 'lucide-react'
import { useCampaignStore } from '../store/useCampaignStore'
import { updateCampaign } from '../lib/firestore'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

const CAMPAIGN_ID = 'main'

const HOURLY_SLOTS = Array.from({ length: 10 }, (_, i) => `${String(9 + i).padStart(2, '0')}:00`)

function formatSlot(t: string) {
  return format(parse(t, 'HH:mm', new Date()), 'h a')
}

export function TimePoll() {
  const { campaign, players } = useCampaignStore()
  const myId = useCampaignStore((s) => s.activePlayerId)

  const nextDate = campaign?.nextSessionDate
  const nextTime = campaign?.nextSessionTime
  const timeVotes: Record<string, string[]> = campaign?.timeVotes ?? {}
  const minPlayers = campaign?.minPlayers ?? players.length

  const playersWhoVoted = new Set(Object.values(timeVotes).flat())
  const enoughVoted = playersWhoVoted.size > 0 && playersWhoVoted.size >= minPlayers

  useEffect(() => {
    if (!enoughVoted) return
    const withVotes = HOURLY_SLOTS.filter((t) => (timeVotes[t]?.length ?? 0) > 0)
    if (withVotes.length === 0) return
    const winner = withVotes.reduce((best, t) =>
      (timeVotes[t]?.length ?? 0) > (timeVotes[best]?.length ?? 0) ? t : best
    )
    if (winner && nextTime !== winner) {
      updateCampaign({ nextSessionTime: winner })
    }
  }, [enoughVoted])

  if (!nextDate || nextTime) return null

  async function vote(t: string) {
    if (!myId) return
    try {
      const current = timeVotes[t] ?? []
      const already = current.includes(myId)
      const updated = already ? current.filter((id) => id !== myId) : [...current, myId]
      await updateDoc(doc(db, 'campaigns', CAMPAIGN_ID), { [`timeVotes.${t}`]: updated })
    } catch (e) {
      alert(`Failed to vote: ${e}`)
    }
  }

  return (
    <div className="mx-3 md:mx-6 mb-4 bg-dungeon-800 border border-amber-700/50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <Clock className="w-4 h-4 text-amber-500" />
        <p className="text-amber-400 font-semibold text-sm" style={{ fontFamily: 'Cinzel, serif' }}>
          What time on {format(parseISO(nextDate), 'MMM d')}?
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        {HOURLY_SLOTS.map((t) => {
          const voters = timeVotes[t] ?? []
          const myVoteIsHere = voters.includes(myId ?? '')
          return (
            <div key={t} className="flex flex-col items-center gap-1">
              <button
                onClick={() => vote(t)}
                className={`px-3 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                  myVoteIsHere
                    ? 'bg-emerald-800/50 border-emerald-500 text-emerald-300'
                    : 'bg-dungeon-900 border-amber-900/40 text-stone-300 hover:border-amber-600'
                }`}
              >
                {formatSlot(t)}
              </button>
              <div className="flex gap-0.5 flex-wrap justify-center">
                {voters.map((pid) => {
                  const p = players.find((pl) => pl.id === pid)
                  return p ? <span key={pid} role="img" aria-label={p.characterName} className="w-2 h-2 rounded-full" style={{ background: p.color }} title={p.characterName} /> : null
                })}
              </div>
              <span className="text-stone-600 text-xs">{voters.length}/{minPlayers}</span>
            </div>
          )
        })}
      </div>
      <p className="text-stone-600 text-xs mt-2">
        Confirms once {minPlayers} player{minPlayers !== 1 ? 's' : ''} vote for the same time.
      </p>
    </div>
  )
}
