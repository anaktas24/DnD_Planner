import { useState, useEffect, useRef } from 'react'
import { Dices, Swords, Menu, ChevronDown, Plus, Clock3 } from 'lucide-react'
import { formatDistanceToNow, parseISO, isPast, format } from 'date-fns'
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
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [newArcMode, setNewArcMode] = useState(false)
  const [newArcName, setNewArcName] = useState('')
  const [, setTick] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
        setNewArcMode(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!campaign) return null

  const nextSession = campaign.nextSessionDate ? parseISO(campaign.nextSessionDate) : null
  const countdown =
    nextSession && !isPast(nextSession)
      ? formatDistanceToNow(nextSession, { addSuffix: true })
      : null

  const arcHistory = campaign.arcHistory ?? []

  async function startNewArc() {
    if (!newArcName.trim()) return
    const currentArc = { name: campaign!.name, startedAt: campaign!.createdAt ?? new Date().toISOString() }
    const updatedHistory = [...arcHistory, currentArc]
    await updateCampaign({ name: newArcName.trim(), arcHistory: updatedHistory })
    setNewArcName('')
    setNewArcMode(false)
    setDropdownOpen(false)
  }

  return (
    <header className="bg-dungeon-900 border-b-2 border-amber-700 px-4 md:px-6 py-3">
      <div className="flex items-center justify-between gap-4">

        {/* Left */}
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

          {/* Campaign name dropdown */}
          <div className="relative min-w-0" ref={dropdownRef}>
            <button
              onClick={() => { setDropdownOpen((o) => !o); setNewArcMode(false) }}
              className="flex items-center gap-1.5 group min-w-0"
            >
              <h1
                className="text-lg md:text-xl font-bold text-amber-400 group-hover:text-amber-300 truncate"
                style={{ fontFamily: 'Cinzel Decorative, serif' }}
              >
                {campaign.name}
              </h1>
              <ChevronDown className={`w-4 h-4 text-amber-600 shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-64 bg-dungeon-800 border border-amber-800 rounded-xl shadow-2xl z-50 overflow-hidden">

                {/* Current arc */}
                <div className="px-3 py-2 border-b border-amber-900/40">
                  <p className="text-stone-600 text-xs uppercase tracking-wider mb-1">Current Arc</p>
                  <p className="text-amber-400 font-semibold text-sm" style={{ fontFamily: 'Cinzel, serif' }}>
                    {campaign.name}
                  </p>
                </div>

                {/* Past arcs */}
                {arcHistory.length > 0 && (
                  <div className="px-3 py-2 border-b border-amber-900/40">
                    <p className="text-stone-600 text-xs uppercase tracking-wider mb-2">Past Arcs</p>
                    <div className="flex flex-col gap-1.5">
                      {[...arcHistory].reverse().map((arc, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Clock3 className="w-3 h-3 text-stone-600 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-stone-400 text-sm truncate">{arc.name}</p>
                            <p className="text-stone-600 text-xs">
                              {format(parseISO(arc.startedAt), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New arc */}
                {newArcMode ? (
                  <div className="px-3 py-3 flex flex-col gap-2">
                    <input
                      className="input-field text-sm"
                      placeholder="New arc name..."
                      value={newArcName}
                      onChange={(e) => setNewArcName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && startNewArc()}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button onClick={startNewArc} disabled={!newArcName.trim()} className="btn-primary text-xs px-3 py-1.5 flex-1 disabled:opacity-50">
                        Start Arc
                      </button>
                      <button onClick={() => setNewArcMode(false)} className="text-stone-500 hover:text-stone-300 text-xs px-2">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setNewArcMode(true)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-amber-600 hover:text-amber-400 hover:bg-dungeon-700 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    New Arc
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 text-stone-300 text-sm">
            <Swords className="w-4 h-4 text-amber-600" />
            <span>Session <span className="text-amber-400 font-bold text-base">#{campaign.sessionCount}</span></span>
            {countdown && (
              <>
                <span className="text-stone-600">·</span>
                <span className="text-amber-400 font-semibold text-xs">{countdown}</span>
                {campaign.nextSessionTime && (
                  <span className="text-amber-600 text-xs">· {campaign.nextSessionTime}</span>
                )}
              </>
            )}
          </div>

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

          <div className="flex items-center gap-1 border-l border-amber-900 pl-2 md:pl-3">
            <ProfileButton />
            <ToolsMenu onNavigate={onNavigate} />
          </div>
        </div>
      </div>
    </header>
  )
}
