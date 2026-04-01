import { useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { Clock } from 'lucide-react'
import { useCampaignStore } from '../store/useCampaignStore'
import { voteForTimeSlot, updateCampaign } from '../lib/firestore'
import type { TimeSlot } from '../types'

const SLOTS: TimeSlot[] = ['Morning', 'Afternoon', 'Evening']
const SLOT_HOURS: Record<TimeSlot, string> = {
  Morning: '10:00',
  Afternoon: '14:00',
  Evening: '19:00',
}

const PLAYER_ID_KEY = 'dnd_player_id'

export function TimePoll() {
  const { campaign, players } = useCampaignStore()
  const myId = localStorage.getItem(PLAYER_ID_KEY)
  const me = players.find((p) => p.id === myId)

  const nextDate = campaign?.nextSessionDate
  const nextTime = campaign?.nextSessionTime
  const hasMarkedDates = (me?.availability.length ?? 0) > 0

  const timeVotes: Record<TimeSlot, string[]> = {
    Morning: campaign?.timeVotes?.Morning ?? [],
    Afternoon: campaign?.timeVotes?.Afternoon ?? [],
    Evening: campaign?.timeVotes?.Evening ?? [],
  }

  const playersWhoVoted = new Set(SLOTS.flatMap((s) => timeVotes[s]))
  const allVoted = players.length > 0 && players.every((p) => playersWhoVoted.has(p.id))

  const winner: TimeSlot | null = allVoted
    ? SLOTS.reduce<TimeSlot>(
        (best, slot) => timeVotes[slot].length > timeVotes[best].length ? slot : best,
        'Evening'
      )
    : null

  useEffect(() => {
    if (winner && nextTime !== winner) {
      updateCampaign({ nextSessionTime: winner })
    }
  }, [winner, nextTime])

  if (!nextDate) return null
  if (nextTime) return null

  const myVotes = new Set(SLOTS.filter((s) => timeVotes[s].includes(myId ?? '')))

  async function vote(slot: TimeSlot) {
    if (!myId) return
    await voteForTimeSlot(myId, slot)
  }

  return (
    <div className="mx-3 md:mx-6 mb-4 bg-dungeon-800 border border-amber-700/50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <Clock className="w-4 h-4 text-amber-500" />
        <p className="text-amber-400 font-semibold text-sm" style={{ fontFamily: 'Cinzel, serif' }}>
          What time works on {format(parseISO(nextDate), 'MMM d')}?
        </p>
      </div>
      <p className="text-stone-600 text-xs mb-3">Vote for your preferred time slot</p>

      {!hasMarkedDates ? (
        <p className="text-stone-500 text-sm italic">Mark your availability first before voting.</p>
      ) : (
        <div className="flex gap-2">
          {SLOTS.map((slot) => {
            const slotVoters = timeVotes[slot]
            const myVoteIsHere = myVotes.has(slot)

            return (
              <button
                key={slot}
                onClick={() => vote(slot)}
                className={`flex-1 flex flex-col items-center rounded-lg px-2 py-2.5 border transition-colors text-sm ${
                  myVoteIsHere
                    ? 'bg-emerald-800/50 border-emerald-500 text-emerald-300'
                    : 'bg-dungeon-900 border-amber-900/40 text-stone-300 hover:border-amber-600'
                }`}
              >
                <span className="font-medium">{slot}</span>
                <span className="text-stone-500 text-xs">{SLOT_HOURS[slot]}</span>
                <div className="flex gap-0.5 mt-1.5 flex-wrap justify-center">
                  {slotVoters.map((pid) => {
                    const p = players.find((pl) => pl.id === pid)
                    return p ? (
                      <span key={pid} className="w-2 h-2 rounded-full" style={{ background: p.color }} title={p.characterName} />
                    ) : null
                  })}
                </div>
                <span className="text-stone-600 text-xs mt-0.5">{slotVoters.length}/{players.length}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
