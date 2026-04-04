import { useState, useEffect, useRef } from 'react'
import { Dices, Swords, Users, ChevronDown, Plus, Clock3, ChevronUp, Pencil, Trash2, Check, X, ScrollText } from 'lucide-react'
import { parseISO, isPast, format, differenceInDays } from 'date-fns'
import { useCampaignStore } from '../store/useCampaignStore'
import { updateCampaign } from '../lib/firestore'
import { ToolsMenu, SessionMenu, ProfileButton } from './ToolsMenu'
import { NotificationBell } from './NotificationBell'

const BLOG_SEEN_KEY = 'dnd_blog_last_seen'

type View = 'home' | 'blog' | 'admin'

interface Props {
  onMenuClick: () => void
  currentView: View
  onNavigate: (view: View) => void
}

export function CampaignHeader({ onMenuClick, currentView, onNavigate }: Props) {
  const campaign = useCampaignStore((s) => s.campaign)
  const blogPosts = useCampaignStore((s) => s.blogPosts)
  const myId = useCampaignStore((s) => s.activePlayerId)
  const isAdmin = myId ? (campaign?.roles?.[myId] ?? 'player') === 'admin' : false
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [lastSeen, setLastSeen] = useState(() => localStorage.getItem(BLOG_SEEN_KEY) ?? '')

  const hasUnreadBlog = blogPosts.length > 0 && (lastSeen === '' || blogPosts.some((p) => p.createdAt > lastSeen))

  function navigateTo(view: View) {
    if (view === 'blog') {
      const now = new Date().toISOString()
      localStorage.setItem(BLOG_SEEN_KEY, now)
      setLastSeen(now)
    }
    onNavigate(view)
  }
  const [newArcMode, setNewArcMode] = useState(false)
  const [newArcName, setNewArcName] = useState('')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingCurrent, setEditingCurrent] = useState(false)
  const [editingCurrentName, setEditingCurrentName] = useState('')
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
  const daysUntil = nextSession && !isPast(nextSession) ? differenceInDays(nextSession, new Date()) : null
  const countdown = daysUntil !== null ? (daysUntil === 0 ? 'Today!' : `${daysUntil}d`) : null

  const arcHistory = campaign.arcHistory ?? []

  async function moveArc(index: number, direction: -1 | 1) {
    const updated = [...arcHistory]
    const swapIndex = index + direction
    if (swapIndex < 0 || swapIndex >= updated.length) return
    ;[updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]]
    await updateCampaign({ arcHistory: updated })
  }

  async function saveCurrentEdit() {
    if (!editingCurrentName.trim()) return
    await updateCampaign({ name: editingCurrentName.trim() })
    setEditingCurrent(false)
  }

  async function saveArcEdit(index: number) {
    if (!editingName.trim()) return
    const updated = [...arcHistory]
    updated[index] = { ...updated[index], name: editingName.trim() }
    await updateCampaign({ arcHistory: updated })
    setEditingIndex(null)
  }

  async function deleteArc(index: number) {
    if (!confirm('Delete this arc from history?')) return
    const updated = arcHistory.filter((_, i) => i !== index)
    await updateCampaign({ arcHistory: updated })
  }

  async function switchToArc(index: number) {
    const selected = arcHistory[index]
    const currentArc = { name: campaign!.name, startedAt: campaign!.createdAt ?? new Date().toISOString() }
    const updated = [...arcHistory]
    updated[index] = currentArc
    await updateCampaign({ name: selected.name, arcHistory: updated })
    setDropdownOpen(false)
  }

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
    <header className="bg-dungeon-900 border-b-2 border-amber-700 px-4 md:px-6 py-2">
      {/* Main row */}
      <div className="flex items-center justify-between gap-2">

        {/* Left — dice (mobile: opens dropdown, desktop: home) + campaign name (desktop only) */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Dice — always home */}
          <button
            onClick={() => onNavigate('home')}
            className="text-amber-500 hover:text-amber-300 transition-colors shrink-0"
            title="Home"
          >
            <Dices className="w-7 h-7 md:w-8 md:h-8" />
          </button>

          {/* Campaign name dropdown */}
          <div className="relative min-w-0" ref={dropdownRef}>
            <button
              onClick={() => { setDropdownOpen((o) => !o); setNewArcMode(false) }}
              className="flex items-center gap-1 group min-w-0"
            >
              <h1
                className="text-xs md:text-xl font-bold text-amber-400 group-hover:text-amber-300 truncate max-w-[80px] sm:max-w-[220px] md:max-w-none"
                style={{ fontFamily: 'Cinzel Decorative, serif' }}
              >
                {campaign.name}
              </h1>
              <ChevronDown className={`w-3 h-3 md:w-4 md:h-4 text-amber-600 shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-64 bg-dungeon-800 border border-amber-800 rounded-xl shadow-2xl z-50 overflow-hidden">

                {/* Current arc */}
                <div className="px-3 py-2 border-b border-amber-900/40">
                  <p className="text-stone-600 text-xs uppercase tracking-wider mb-1">Current Arc</p>
                  {editingCurrent ? (
                    <div className="flex gap-1 items-center">
                      <input
                        className="input-field text-sm py-0.5 flex-1"
                        value={editingCurrentName}
                        onChange={(e) => setEditingCurrentName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveCurrentEdit()}
                        autoFocus
                      />
                      <button onClick={saveCurrentEdit} className="text-emerald-400 hover:text-emerald-300"><Check className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setEditingCurrent(false)} className="text-stone-500 hover:text-stone-300"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 group">
                      <p className="text-amber-400 font-semibold text-sm flex-1" style={{ fontFamily: 'Cinzel, serif' }}>{campaign.name}</p>
                      <button onClick={() => { setEditingCurrentName(campaign!.name); setEditingCurrent(true) }}
                        className="opacity-0 group-hover:opacity-100 text-stone-600 hover:text-amber-400 transition-all">
                        <Pencil className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Past arcs */}
                {arcHistory.length > 0 && (
                  <div className="px-3 py-2 border-b border-amber-900/40">
                    <p className="text-stone-600 text-xs uppercase tracking-wider mb-2">Past Arcs</p>
                    <div className="flex flex-col gap-1.5">
                      {arcHistory.map((arc, i) => (
                        <div key={i} className="flex items-center gap-1 group">
                          <Clock3 className="w-3 h-3 text-stone-600 shrink-0" />
                          <div className="min-w-0 flex-1">
                            {editingIndex === i ? (
                              <div className="flex gap-1 items-center">
                                <input
                                  className="input-field text-xs py-0.5 flex-1"
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && saveArcEdit(i)}
                                  autoFocus
                                />
                                <button onClick={() => saveArcEdit(i)} className="text-emerald-400 hover:text-emerald-300"><Check className="w-3 h-3" /></button>
                                <button onClick={() => setEditingIndex(null)} className="text-stone-500 hover:text-stone-300"><X className="w-3 h-3" /></button>
                              </div>
                            ) : (
                              <button onClick={() => switchToArc(i)}
                                className="text-stone-400 hover:text-amber-400 text-sm truncate transition-colors text-left w-full">
                                {arc.name}
                              </button>
                            )}
                            <p className="text-stone-600 text-xs">{format(parseISO(arc.startedAt), 'MMM d, yyyy')}</p>
                          </div>
                          {editingIndex !== i && (
                            <>
                              <button onClick={() => { setEditingName(arc.name); setEditingIndex(i) }}
                                className="opacity-0 group-hover:opacity-100 text-stone-600 hover:text-amber-400 transition-all shrink-0">
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button onClick={() => deleteArc(i)}
                                className="opacity-0 group-hover:opacity-100 text-stone-600 hover:text-red-400 transition-all shrink-0">
                                <Trash2 className="w-3 h-3" />
                              </button>
                              <div className="flex flex-col shrink-0">
                                <button onClick={() => moveArc(i, -1)} disabled={i === 0}
                                  className="text-stone-600 hover:text-amber-400 disabled:opacity-20 transition-colors">
                                  <ChevronUp className="w-3 h-3" />
                                </button>
                                <button onClick={() => moveArc(i, 1)} disabled={i === arcHistory.length - 1}
                                  className="text-stone-600 hover:text-amber-400 disabled:opacity-20 transition-colors">
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                              </div>
                            </>
                          )}
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
          <div className="hidden sm:flex items-center gap-4 text-stone-300 text-sm">
            <div className="flex items-center gap-1.5">
              <Swords className="w-5 h-5 text-amber-600" />
              <span>Session <span className="text-amber-400 font-bold text-2xl">#{campaign.sessionCount}</span></span>
            </div>
            {countdown && (
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold text-2xl">{countdown}</span>
                {campaign.nextSessionTime && (
                  <span className="text-amber-600 text-base">· {campaign.nextSessionTime}</span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 md:border-l md:border-amber-900 md:pl-3">
            <button
              onClick={onMenuClick}
              className="p-2 rounded-lg text-stone-500 hover:text-amber-400 transition-colors md:hidden"
              title="Adventurers"
            >
              <Users className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigateTo(currentView === 'blog' ? 'home' : 'blog')}
              className={`relative p-2 rounded-lg transition-colors ${
                currentView === 'blog' ? 'text-amber-300' : hasUnreadBlog ? 'text-amber-200 hover:text-amber-100' : 'text-stone-500 hover:text-amber-400'
              }`}
              title="The Story So Far"
              style={hasUnreadBlog && currentView !== 'blog' ? { filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.8))' } : {}}
            >
              <ScrollText className="w-5 h-5" />
              {hasUnreadBlog && currentView !== 'blog' && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              )}
            </button>
            {isAdmin && <SessionMenu />}
            {isAdmin && <ToolsMenu onNavigate={navigateTo} />}
            <NotificationBell />
            <ProfileButton />
          </div>
        </div>
      </div>
      {/* Mobile second row — session info centered */}
      <div className="flex sm:hidden justify-center mt-1.5 pt-1.5 border-t border-amber-900/30">
        <div className="flex items-center gap-2 text-xs text-stone-400">
          <Swords className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Session <span className="text-amber-400 font-bold">#{campaign.sessionCount}</span></span>
          {countdown && <span className="text-amber-400 font-bold">{countdown}</span>}
          {campaign.nextSessionTime && countdown && <span className="text-amber-600">· {campaign.nextSessionTime}</span>}
        </div>
      </div>
    </header>
  )
}
