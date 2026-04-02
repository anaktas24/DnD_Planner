import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { Clock, Plus, X } from 'lucide-react'
import { useCampaignStore } from '../store/useCampaignStore'
import { updateCampaign } from '../lib/firestore'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

const PLAYER_ID_KEY = 'dnd_player_id'
const CAMPAIGN_ID = 'main'

export function TimePoll() {
  const { campaign, players } = useCampaignStore()
  const myId = localStorage.getItem(PLAYER_ID_KEY)
  const myRole = myId ? (campaign?.roles?.[myId] ?? 'player') : 'player'
  const isAdmin = myRole === 'admin'

  const [newTime, setNewTime] = useState('')

  const nextDate = campaign?.nextSessionDate
  const nextTime = campaign?.nextSessionTime
  const timeVotes: Record<string, string[]> = campaign?.timeVotes ?? {}
  const proposedTimes = Object.keys(timeVotes)

  const playersWhoVoted = new Set(Object.values(timeVotes).flat())
  const allVoted = players.length > 0 && players.every((p) => playersWhoVoted.has(p.id))

  useEffect(() => {
    if (!allVoted || proposedTimes.length === 0) return
    const winner = proposedTimes.reduce((best, t) =>
      (timeVotes[t]?.length ?? 0) > (timeVotes[best]?.length ?? 0) ? t : best
    )
    if (winner && nextTime !== winner) {
      updateCampaign({ nextSessionTime: winner })
    }
  }, [allVoted])

  if (!nextDate || nextTime) return null
  if (proposedTimes.length === 0 && !isAdmin) return null

  async function addTime() {
    if (!newTime) return
    const updated = { ...timeVotes, [newTime]: timeVotes[newTime] ?? [] }
    await updateDoc(doc(db, 'campaigns', CAMPAIGN_ID), { timeVotes: updated })
    setNewTime('')
  }

  async function removeTime(t: string) {
    const updated = { ...timeVotes }
    delete updated[t]
    await updateDoc(doc(db, 'campaigns', CAMPAIGN_ID), { timeVotes: updated })
  }

  async function vote(t: string) {
    if (!myId) return
    const current = timeVotes[t] ?? []
    const already = current.includes(myId)
    const updated = already ? current.filter((id) => id !== myId) : [...current, myId]
    await updateDoc(doc(db, 'campaigns', CAMPAIGN_ID), { [`timeVotes.${t}`]: updated })
  }

  return (
    <div className="mx-3 md:mx-6 mb-4 bg-dungeon-800 border border-amber-700/50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <Clock className="w-4 h-4 text-amber-500" />
        <p className="text-amber-400 font-semibold text-sm" style={{ fontFamily: 'Cinzel, serif' }}>
          What time on {format(parseISO(nextDate), 'MMM d')}?
        </p>
      </div>

      {isAdmin && (
        <div className="flex items-center gap-2 mt-3 mb-3">
          <input
            type="time"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            className="input-field w-32 text-sm py-1"
          />
          <button
            onClick={addTime}
            disabled={!newTime || !!timeVotes[newTime]}
            className="flex items-center gap-1 text-xs px-2 py-1.5 border border-amber-700 text-amber-400 hover:bg-amber-900/30 rounded-lg transition-colors disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" /> Add option
          </button>
        </div>
      )}

      {proposedTimes.length === 0 ? (
        <p className="text-stone-500 text-sm italic">No time options yet — add some above.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {proposedTimes.sort().map((t) => {
            const voters = timeVotes[t] ?? []
            const myVoteIsHere = voters.includes(myId ?? '')
            return (
              <div key={t} className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => vote(t)}
                    className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                      myVoteIsHere
                        ? 'bg-emerald-800/50 border-emerald-500 text-emerald-300'
                        : 'bg-dungeon-900 border-amber-900/40 text-stone-300 hover:border-amber-600'
                    }`}
                  >
                    {t}
                  </button>
                  {isAdmin && (
                    <button onClick={() => removeTime(t)} className="text-stone-600 hover:text-red-400 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex gap-0.5 flex-wrap justify-center">
                  {voters.map((pid) => {
                    const p = players.find((pl) => pl.id === pid)
                    return p ? <span key={pid} className="w-2 h-2 rounded-full" style={{ background: p.color }} title={p.characterName} /> : null
                  })}
                </div>
                <span className="text-stone-600 text-xs">{voters.length}/{players.length}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
