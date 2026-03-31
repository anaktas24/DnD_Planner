import { useState, useEffect } from 'react'
import { Dices, Swords, Menu } from 'lucide-react'
import { formatDistanceToNow, parseISO, isPast } from 'date-fns'
import { useCampaignStore } from '../store/useCampaignStore'
import { updateCampaign } from '../lib/firestore'
import { ToolsMenu, ProfileButton } from './ToolsMenu'

type View = 'home' | 'blog' | 'admin'

interface Props {
  onMenuClick: () => void
  currentView: View
  onNavigate: (view: View) => void
}

export function CampaignHeader({ onMenuClick, currentView, onNavigate }: Props) {
  const campaign = useCampaignStore((s) => s.campaign)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '' })
  const [, setTick] = useState(0)

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
    <header className="bg-dungeon-900 border-b-2 border-amber-700 px-4 md:px-6 py-3">
      <div className="flex items-center justify-between gap-4">

        {/* Left: mobile menu + dice logo + campaign name */}
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onMenuClick} className="md:hidden text-amber-600 hover:text-amber-400 transition-colors shrink-0">
            <Menu className="w-6 h-6" />
          </button>
          <button
            onClick={() => onNavigate('home')}
            className="text-amber-500 hover:text-amber-300 transition-colors shrink-0"
            title="Home"
          >
            <Dices className="w-8 h-8" />
          </button>

          {editing ? (
            <div className="flex gap-2 items-center">
              <input
                className="bg-dungeon-800 border border-amber-700 text-amber-100 rounded px-2 py-1 text-lg"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Campaign name"
                autoFocus
              />
              <button onClick={save} className="text-amber-400 hover:text-amber-200 text-sm px-2 py-1 border border-amber-700 rounded">Save</button>
              <button onClick={() => setEditing(false)} className="text-stone-400 hover:text-stone-200 text-sm">Cancel</button>
            </div>
          ) : (
            <h1
              className="text-lg md:text-xl font-bold text-amber-400 cursor-pointer hover:text-amber-300 truncate"
              style={{ fontFamily: 'Cinzel Decorative, serif' }}
              onClick={startEdit}
              title="Click to edit"
            >
              {campaign.name}
            </h1>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          {/* Session info */}
          {countdown && (
            <div className="hidden sm:flex items-center gap-1.5 text-stone-300 text-sm">
              <Swords className="w-4 h-4 text-amber-600" />
              <span>
                Session <span className="text-amber-400 font-bold text-base">#{campaign.sessionCount}</span>
              </span>
              <span className="text-stone-600">·</span>
              <span className="text-amber-400 font-semibold text-xs">{countdown}</span>
              {campaign.nextSessionTime && (
                <span className="text-amber-600 text-xs">· {campaign.nextSessionTime}</span>
              )}
            </div>
          )}
          {!countdown && (
            <div className="hidden sm:flex items-center gap-1.5 text-stone-300 text-sm">
              <Swords className="w-4 h-4 text-amber-600" />
              <span>Session <span className="text-amber-400 font-bold text-base">#{campaign.sessionCount}</span></span>
            </div>
          )}

          {/* Story so far */}
          <button
            onClick={() => onNavigate(currentView === 'blog' ? 'home' : 'blog')}
            className={`text-sm font-semibold transition-colors hidden sm:block ${
              currentView === 'blog'
                ? 'text-amber-300 underline underline-offset-2'
                : 'text-amber-400 hover:text-amber-300'
            }`}
            style={{ fontFamily: 'Cinzel, serif' }}
          >
            The Story So Far
          </button>

          {/* Profile + tools */}
          <div className="flex items-center gap-1 border-l border-amber-900 pl-2 md:pl-3">
            <ProfileButton />
            <ToolsMenu onNavigate={onNavigate} />
          </div>
        </div>
      </div>
    </header>
  )
}
