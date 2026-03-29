import { useState, useMemo } from 'react'
import {
  startOfMonth, endOfMonth, eachDayOfInterval, getDay,
  format, addMonths, subMonths, isSameMonth, isToday,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCampaignStore } from '../store/useCampaignStore'
import { toggleAvailability, setVote } from '../lib/firestore'
import { DayModal } from './DayModal'

export function Calendar() {
  const [month, setMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const { players, activePlayerId, allFreeDates } = useCampaignStore()

  const days = useMemo(() => {
    const start = startOfMonth(month)
    const end = endOfMonth(month)
    return eachDayOfInterval({ start, end })
  }, [month])

  const freeDates = useMemo(() => new Set(allFreeDates(month)), [allFreeDates, month])

  const startPad = getDay(startOfMonth(month)) // 0 = Sun

  async function handleDayClick(dateStr: string) {
    if (activePlayerId) {
      await toggleAvailability(activePlayerId, dateStr)
    } else {
      setSelectedDate(dateStr)
    }
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 p-3 md:p-6">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setMonth((m) => subMonths(m, 1))}
          className="p-2 text-stone-400 hover:text-amber-400 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2
          className="text-xl font-bold text-amber-400"
          style={{ fontFamily: 'Cinzel, serif' }}
        >
          {format(month, 'MMMM yyyy')}
        </h2>
        <button
          onClick={() => setMonth((m) => addMonths(m, 1))}
          className="p-2 text-stone-400 hover:text-amber-400 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Active player hint */}
      {activePlayerId && (() => {
        const p = players.find((pl) => pl.id === activePlayerId)
        return p ? (
          <p className="text-center text-sm text-stone-400 mb-4">
            Marking availability for{' '}
            <span className="font-semibold" style={{ color: p.color }}>
              {p.characterName || p.name}
            </span>{' '}
            — click days to toggle
          </p>
        ) : null
      })()}

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
          <div key={d} className="text-center text-xs text-stone-600 font-semibold py-1 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1 flex-1">
        {/* Padding cells */}
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}

        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const isFree = freeDates.has(dateStr)
          const inMonth = isSameMonth(day, month)
          const today = isToday(day)

          // Dots for each player that marked this day
          const availablePlayers = players.filter((p) => p.availability.includes(dateStr))
          const activePlayer = players.find((p) => p.id === activePlayerId)
          const activeMarked = activePlayer?.availability.includes(dateStr)

          return (
            <button
              key={dateStr}
              onClick={() => handleDayClick(dateStr)}
              disabled={!inMonth}
              className={`
                relative rounded-lg aspect-square flex flex-col items-center justify-start pt-1 pb-0.5 px-0.5
                transition-all duration-150 border
                ${!inMonth ? 'opacity-0 pointer-events-none' : ''}
                ${isFree ? 'bg-emerald-900/50 border-emerald-600/60 hover:bg-emerald-800/60' : 'border-transparent hover:bg-dungeon-800'}
                ${today ? 'ring-1 ring-amber-500' : ''}
                ${activeMarked ? 'border-opacity-100' : ''}
              `}
              style={
                activeMarked && activePlayer
                  ? { borderColor: activePlayer.color + '80', background: activePlayer.color + '20' }
                  : {}
              }
            >
              <span
                className={`text-base font-semibold ${
                  today ? 'text-amber-400' : isFree ? 'text-emerald-300' : 'text-stone-400'
                }`}
              >
                {format(day, 'd')}
              </span>

              {/* Player availability names */}
              <div className="flex flex-col gap-0.5 w-full mt-auto px-0.5 mb-0.5">
                {availablePlayers.map((p) => (
                  <span
                    key={p.id}
                    className="text-[9px] leading-tight font-medium truncate rounded px-0.5"
                    style={{ color: p.color }}
                  >
                    {p.characterName || p.name}
                  </span>
                ))}
              </div>
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-xs text-stone-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-900/50 border border-emerald-600/60 inline-block" />
          All players free
        </span>
        {players.map((p) => (
          <span key={p.id} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
            {p.characterName || p.name}
          </span>
        ))}
      </div>

      {/* Day detail modal */}
      {selectedDate && (
        <DayModal
          date={selectedDate}
          onClose={() => setSelectedDate(null)}
          onVote={(playerId, vote) => setVote(playerId, selectedDate, vote)}
        />
      )}
    </div>
  )
}
