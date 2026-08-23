import { useState, useRef, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { CalendarDays, Play, XCircle, PlusCircle, Trash2, PartyPopper, UserX } from 'lucide-react'
import { useCampaignStore } from '../store/useCampaignStore'
import { updateCampaign, clearCurrentMonthUpToToday, deletePastDates } from '../lib/firestore'

export function SessionMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const { campaign, players, allGreenDates } = useCampaignStore()
  const greenDates = allGreenDates()
  const missing = players.filter((p) => p.availability.length === 0)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function sessionComplete() {
    if (!confirm('Mark session as complete? This will bump the count, clear the date, votes and past dates.')) return
    await updateCampaign({
      sessionCount: (campaign?.sessionCount ?? 0) + 1,
      nextSessionDate: null,
      nextSessionTime: null,
      dateVotes: {},
      timeVotes: {},
      discordDateNotified: false,
      discordTimeNotified: false,
      sessionLocation: null,
    })
    await deletePastDates()
    setOpen(false)
  }

  async function startCountdown() {
    if (greenDates.length === 1) await updateCampaign({ nextSessionDate: greenDates[0] })
    setOpen(false)
  }

  async function resetSession() {
    await updateCampaign({ nextSessionDate: null, nextSessionTime: null, dateVotes: {}, timeVotes: {}, discordDateNotified: false, discordTimeNotified: false })
    setOpen(false)
  }

  async function resetTimeOnly() {
    await updateCampaign({ nextSessionTime: null, timeVotes: {}, discordTimeNotified: false })
    setOpen(false)
  }

  async function bumpSession() {
    await updateCampaign({ sessionCount: (campaign?.sessionCount ?? 0) + 1 })
    setOpen(false)
  }

  async function decreaseSession() {
    const current = campaign?.sessionCount ?? 0
    if (current <= 0) return
    await updateCampaign({ sessionCount: current - 1 })
    setOpen(false)
  }

  async function clearSession() {
    if (!confirm('Clear availability dates for the current month up to today?')) return
    await clearCurrentMonthUpToToday()
    await updateCampaign({ nextSessionDate: null, dateVotes: {} })
    setOpen(false)
  }

  const items = [
    {
      icon: PartyPopper,
      label: 'Session complete!',
      sublabel: 'Bump count, reset date & remove past dates',
      onClick: sessionComplete,
      disabled: false,
      highlight: true,
    },
    {
      icon: Play,
      label: 'Start countdown',
      sublabel: greenDates.length === 1 ? `Set ${format(parseISO(greenDates[0]), 'MMM d')} as next session` : 'Need exactly 1 green date',
      onClick: startCountdown,
      disabled: greenDates.length !== 1 || !!campaign?.nextSessionDate,
    },
    {
      icon: XCircle,
      label: 'Reset session date',
      sublabel: 'Clear date + time',
      onClick: resetSession,
      disabled: !campaign?.nextSessionDate,
    },
    {
      icon: XCircle,
      label: 'Reset time only',
      sublabel: 'Reopen time voting, keep date',
      onClick: resetTimeOnly,
      disabled: !campaign?.nextSessionTime,
    },
    {
      icon: PlusCircle,
      label: `Session +1`,
      sublabel: `Bump to #${(campaign?.sessionCount ?? 0) + 1}`,
      onClick: bumpSession,
      disabled: false,
    },
    {
      icon: XCircle,
      label: 'Session -1',
      sublabel: `Back to #${Math.max(0, (campaign?.sessionCount ?? 0) - 1)}`,
      onClick: decreaseSession,
      disabled: (campaign?.sessionCount ?? 0) <= 0,
    },
    {
      icon: Trash2,
      label: 'Clear session',
      sublabel: "Remove this month's dates up to today",
      onClick: clearSession,
      disabled: false,
      danger: true,
    },
  ]

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`p-2 rounded-lg transition-colors ${open ? 'bg-amber-900/40 text-amber-400' : 'text-stone-500 hover:text-amber-400'}`}
        title="Session"
      >
        <CalendarDays className="w-5 h-5" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-68 bg-dungeon-800 border border-amber-800 rounded-xl shadow-2xl z-50 overflow-hidden" style={{ width: '17rem' }}>
          <div className="px-3 py-2 border-b border-amber-900/40">
            <p className="text-amber-600 text-xs font-semibold uppercase tracking-wider">Session</p>
          </div>

          {missing.length > 0 && (
            <div className="px-3 py-2 bg-red-950/40 border-b border-red-900/40">
              <div className="flex items-center gap-1.5 text-red-400 text-xs font-semibold mb-1">
                <UserX className="w-3.5 h-3.5" />
                Hasn't marked dates yet
              </div>
              <div className="flex flex-wrap gap-1">
                {missing.map((p) => (
                  <span key={p.id} className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: p.color + '30', color: p.color }}>
                    {p.characterName}
                  </span>
                ))}
              </div>
            </div>
          )}

          {items.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              disabled={item.disabled}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors disabled:opacity-30 disabled:cursor-not-allowed
                ${item.highlight ? 'hover:bg-emerald-900/30' : item.danger ? 'hover:bg-red-900/30' : 'hover:bg-dungeon-700'}`}
            >
              <item.icon className={`w-4 h-4 shrink-0 ${item.highlight ? 'text-emerald-400' : item.danger ? 'text-red-500' : 'text-amber-600'}`} />
              <div>
                <p className={`text-sm font-medium ${item.highlight ? 'text-emerald-300' : item.danger ? 'text-red-400' : 'text-stone-200'}`}>{item.label}</p>
                <p className="text-stone-600 text-xs">{item.sublabel}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
