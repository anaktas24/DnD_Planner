import { useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { Vote, CalendarCheck } from 'lucide-react'
import { useCampaignStore } from '../store/useCampaignStore'
import { voteForDate, updateCampaign, clearDateVotes } from '../lib/firestore'


export function DatePoll() {
  const { campaign, players, allGreenDates, pollWinner } = useCampaignStore()
  const greenDates = allGreenDates()
  const myId = useCampaignStore((s) => s.activePlayerId)
  const winner = pollWinner()

  // Auto-resolve when everyone has voted
  useEffect(() => {
    if (winner && campaign?.nextSessionDate !== winner) {
      updateCampaign({ nextSessionDate: winner }).then(() => clearDateVotes())
    }
  }, [winner, campaign?.nextSessionDate])

  // Nothing to show
  if (greenDates.length === 0) return null
  // Already resolved
  if (campaign?.nextSessionDate) return null

  const votes = campaign?.dateVotes ?? {}
  const myVote = Object.entries(votes).find(([, ids]) => ids.includes(myId ?? ''))
  const isMultiple = greenDates.length > 1
  const me = players.find((p) => p.id === myId)
  const hasMarkedDates = (me?.availability.length ?? 0) > 0

  async function vote(date: string) {
    if (!myId) return
    await voteForDate(myId, date, greenDates)
  }

  async function confirmSingle() {
    await updateCampaign({ nextSessionDate: greenDates[0] })
  }

  return (
    <div className="mx-3 md:mx-6 mb-4 bg-amber-900/20 border border-amber-700/50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        {isMultiple ? (
          <Vote className="w-4 h-4 text-amber-500" />
        ) : (
          <CalendarCheck className="w-4 h-4 text-amber-500" />
        )}
        <p className="text-amber-400 font-semibold text-sm" style={{ fontFamily: 'Cinzel, serif' }}>
          {isMultiple ? 'Multiple dates available — vote for one when all have picked the dates!' : 'We found a date!'}
        </p>
      </div>

      {!hasMarkedDates ? (
        <p className="text-stone-500 text-sm italic">Mark your availability on the calendar before voting.</p>
      ) : isMultiple ? (
        <>
          <div className="flex flex-col gap-2">
            {greenDates.map((date) => {
              const dateVoters = votes[date] ?? []
              const myVoteIsHere = myVote?.[0] === date

              return (
                <button
                  key={date}
                  onClick={() => vote(date)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 border transition-colors text-sm ${
                    myVoteIsHere
                      ? 'bg-emerald-800/50 border-emerald-500 text-emerald-300'
                      : 'bg-dungeon-800 border-amber-900/40 text-stone-300 hover:border-amber-600'
                  }`}
                >
                  <span className="font-medium">{format(parseISO(date), 'EEE, MMM d')}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {dateVoters.map((pid) => {
                        const p = players.find((pl) => pl.id === pid)
                        return p ? (
                          <span key={pid} className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} title={p.characterName} />
                        ) : null
                      })}
                    </div>
                    <span className="text-stone-500 text-xs">{dateVoters.length}/{players.length}</span>
                  </div>
                </button>
              )
            })}
          </div>
          <p className="text-amber-600 text-xl mt-2">Poll closes when everyone votes.</p>
        </>
      ) : (
        <div className="flex items-center justify-between">
          <span className="text-emerald-300 font-medium text-sm">
            {format(parseISO(greenDates[0]), 'EEEE, MMMM d')}
          </span>
          <button onClick={confirmSingle} className="btn-primary text-xs px-3 py-1.5">
            Set as next session
          </button>
        </div>
      )}
    </div>
  )
}
