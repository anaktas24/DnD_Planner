import { useState, useEffect } from 'react'
import { Sword, Shield, Clock, Menu } from 'lucide-react'
import { formatDistanceToNow, parseISO, isPast } from 'date-fns'
import { useCampaignStore } from '../store/useCampaignStore'
import { updateCampaign } from '../lib/firestore'

interface Props {
  onMenuClick: () => void
}

export function CampaignHeader({ onMenuClick }: Props) {
  const campaign = useCampaignStore((s) => s.campaign)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '' })
  const [, setTick] = useState(0)

  // Re-render every minute to keep countdown fresh
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000)
    return () => clearInterval(interval)
  }, [])

  if (!campaign) return null

  const nextSession = campaign.nextSessionDate ? parseISO(campaign.nextSessionDate) : null
  const countdown =
    nextSession && !isPast(nextSession)
      ? formatDistanceToNow(nextSession, { addSuffix: true })
      : null

  function startEdit() {
    setForm({ name: campaign!.name })
    setEditing(true)
  }

  async function save() {
    await updateCampaign(form)
    setEditing(false)
  }

  return (
    <header className="bg-dungeon-900 border-b-2 border-amber-700 px-4 md:px-6 py-3 md:py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <button onClick={onMenuClick} className="md:hidden text-amber-600 hover:text-amber-400 transition-colors">
            <Menu className="w-6 h-6" />
          </button>
          <Sword className="text-amber-500 w-6 h-6 md:w-8 md:h-8 shrink-0" />
          {editing ? (
            <div className="flex gap-2 items-center">
              <input
                className="bg-dungeon-800 border border-amber-700 text-amber-100 rounded px-2 py-1 text-lg font-display"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Campaign name"
              />
              <button onClick={save} className="text-amber-400 hover:text-amber-200 text-sm px-2 py-1 border border-amber-700 rounded">
                Save
              </button>
              <button onClick={() => setEditing(false)} className="text-stone-400 hover:text-stone-200 text-sm">
                Cancel
              </button>
            </div>
          ) : (
            <div>
              <h1
                className="text-lg md:text-2xl font-bold text-amber-400 cursor-pointer hover:text-amber-300"
                style={{ fontFamily: 'Cinzel Decorative, serif' }}
                onClick={startEdit}
              >
                {campaign.name}
              </h1>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 md:gap-6 text-sm">
          <div className="flex items-center gap-1.5 text-stone-300">
            <Shield className="w-4 h-4 text-amber-600" />
            <span className="hidden sm:inline">Session </span>
            <span className="text-amber-400 font-bold">#{campaign.sessionCount}</span>
          </div>
          {countdown && (
            <div className="flex items-center gap-1.5 text-stone-300">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">Next </span>
              <span className="text-amber-400 font-bold text-xs md:text-sm">{countdown}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
