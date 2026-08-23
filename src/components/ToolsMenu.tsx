import { useState, useRef, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import {
  Settings, ScrollText,
  Copy, Check, Shield, Send, LogOut, Crown,
} from 'lucide-react'
import { useCampaignStore } from '../store/useCampaignStore'
import { upsertPlayer, claimAdmin } from '../lib/firestore'
import { signOutUser } from '../lib/firebase'

type View = 'home' | 'blog' | 'admin'

const PLAYER_ID_KEY = 'dnd_player_id'

interface ToolsMenuProps {
  onNavigate: (view: View) => void
}

export function ToolsMenu({ onNavigate }: ToolsMenuProps) {
  const [open, setOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const { campaign, players, notes } = useCampaignStore()
  const myId = localStorage.getItem(PLAYER_ID_KEY)
  const myRole = myId ? (campaign?.roles?.[myId] ?? 'player') : 'player'
  const hasAdmin = campaign?.roles ? Object.values(campaign.roles).includes('admin') : false

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function copyDiscordSummary() {
    const next = campaign?.nextSessionDate
      ? `${format(parseISO(campaign.nextSessionDate), 'EEEE, MMMM d')}${campaign.nextSessionTime ? ` — ${campaign.nextSessionTime}` : ''}`
      : 'TBD'
    const confirmed = players.filter((p) => campaign?.nextSessionDate && p.confirmedDates?.includes(campaign.nextSessionDate))
    const declined = players.filter((p) => campaign?.nextSessionDate && p.declinedDates?.includes(campaign.nextSessionDate))
    const lastNote = notes.sort((a, b) => b.sessionNumber - a.sessionNumber)[0]

    const lines = [
      `📅 **${campaign?.name ?? 'Campaign'} — Session #${campaign?.sessionCount ?? '?'}**`,
      `🗓️ Next session: **${next}**`,
      lastNote?.nextLocation ? `📍 Location: ${lastNote.nextLocation}` : '',
      confirmed.length ? `✅ Coming: ${confirmed.map((p) => p.characterName).join(', ')}` : '',
      declined.length ? `❌ Can't make it: ${declined.map((p) => p.characterName).join(', ')}` : '',
    ].filter(Boolean).join('\n')

    navigator.clipboard.writeText(lines)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    setOpen(false)
  }

  async function postToDiscord() {
    const url = campaign?.discordWebhookUrl
    if (!url) { alert('No Discord webhook configured in Admin Panel.'); return }
    const dateStr = campaign?.nextSessionDate ? format(parseISO(campaign.nextSessionDate), 'EEEE, MMMM d') : 'TBD'
    const timeStr = campaign?.nextSessionTime ?? null
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: '⚔️ Session confirmed!',
          description: `**${campaign?.name}** — Session #${campaign?.sessionCount}`,
          color: 0xf59e0b,
          fields: [
            { name: '🗓️ Date', value: dateStr, inline: true },
            ...(timeStr ? [{ name: '🕐 Time', value: timeStr, inline: true }] : []),
            ...(campaign?.sessionLocation ? [{ name: '📍 Location', value: campaign.sessionLocation, inline: false }] : []),
          ],
          footer: { text: 'See you there, adventurers!' },
        }],
      }),
    }).then(() => { alert('Posted to Discord!') }).catch(() => alert('Failed to reach Discord.'))
    setOpen(false)
  }

  type Role = 'admin' | 'editor' | 'player'
  const allItems: { icon: React.ElementType; label: string; sublabel: string; onClick: () => void; disabled: boolean; danger?: boolean; roles: Role[] }[] = [
    {
      roles: ['admin', 'editor'],
      icon: copied ? Check : Copy,
      label: copied ? 'Copied!' : 'Copy Discord summary',
      sublabel: 'Paste into your channel',
      onClick: copyDiscordSummary,
      disabled: false,
    },
    {
      roles: ['admin', 'editor'],
      icon: ScrollText,
      label: 'Session history',
      sublabel: `${notes.length} session${notes.length !== 1 ? 's' : ''} logged`,
      onClick: () => { setHistoryOpen(true); setOpen(false) },
      disabled: notes.length === 0,
    },
    {
      roles: ['admin', 'editor'],
      icon: Send,
      label: 'Post to Discord',
      sublabel: 'Send current session info to Discord',
      onClick: postToDiscord,
      disabled: !campaign?.discordWebhookUrl,
    },
    {
      // Visible to admins always; visible to everyone when no admin exists yet (bootstrap)
      roles: (hasAdmin ? ['admin'] : ['admin', 'editor', 'player']) as Role[],
      icon: Shield,
      label: 'Admin Panel',
      sublabel: hasAdmin ? 'Manage campaign & players' : 'No admin yet — set one up here',
      onClick: () => { onNavigate('admin'); setOpen(false) },
      disabled: false,
    },
  ]

  const items = allItems.filter((item) => item.roles.includes(myRole as Role))

  // Nothing to show — hide the gear entirely
  if (items.length === 0) return null

  return (
    <>
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((o) => !o)}
          className={`p-2 rounded-lg transition-colors ${open ? 'bg-theme-900/40 text-theme-400' : 'text-prose-500 hover:text-theme-400'}`}
          title="Tools"
        >
          <Settings className="w-5 h-5" />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-dungeon-800 border border-theme-800 rounded-xl shadow-2xl z-50 overflow-hidden">
            {items.map((item) => (
              <button
                key={item.label}
                onClick={item.onClick}
                disabled={item.disabled}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors disabled:opacity-30 disabled:cursor-not-allowed
                  ${item.danger ? 'hover:bg-red-900/30' : 'hover:bg-dungeon-700'}`}
              >
                <item.icon className={`w-4 h-4 shrink-0 ${item.danger ? 'text-red-500' : 'text-theme-600'}`} />
                <div>
                  <p className={`text-sm font-medium ${item.danger ? 'text-red-400' : 'text-prose-200'}`}>{item.label}</p>
                  <p className="text-prose-600 text-xs">{item.sublabel}</p>
                </div>
              </button>
            ))}

          </div>
        )}
      </div>

      {/* Session history modal */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setHistoryOpen(false)}>
          <div className="bg-dungeon-900 border border-theme-800 rounded-xl w-full max-w-md mx-4 p-5 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-theme-400 font-bold" style={{ fontFamily: 'Cinzel, serif' }}>Session History</h3>
              <button onClick={() => setHistoryOpen(false)} className="text-prose-500 hover:text-prose-300">✕</button>
            </div>
            {notes.length === 0 ? (
              <p className="text-prose-600 text-sm italic">No sessions logged yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {[...notes].sort((a, b) => b.sessionNumber - a.sessionNumber).map((n) => (
                  <div key={n.id} className="bg-dungeon-800 rounded-lg p-3 border border-theme-900/30">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-theme-500 font-semibold text-xs uppercase tracking-wider">Session #{n.sessionNumber}</span>
                      <span className="text-prose-600 text-xs">{format(parseISO(n.date), 'MMM d, yyyy')}</span>
                    </div>
                    {n.summary && <p className="text-prose-300 text-sm mb-1">{n.summary}</p>}
                    {n.location && <p className="text-prose-500 text-xs">📍 {n.location}</p>}
                    {n.nextLocation && <p className="text-prose-500 text-xs">➡️ Next: {n.nextLocation}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export function ProfileButton() {
  const [open, setOpen] = useState(false)
  const [claimOpen, setClaimOpen] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [claimError, setClaimError] = useState('')
  const [claiming, setClaiming] = useState(false)

  const { players, campaign } = useCampaignStore()
  const myId = localStorage.getItem(PLAYER_ID_KEY)
  const me = players.find((p) => p.id === myId)
  const myRole = myId ? (campaign?.roles?.[myId] ?? 'player') : 'player'
  const isAdmin = myRole === 'admin'
  const hasPIN = !!campaign?.adminPin
  const canBecomeAdmin = !isAdmin && hasPIN

  const CLASS_OPTIONS = [
    'Barbarian','Bard','Cleric','Druid','Fighter','Monk',
    'Paladin','Ranger','Rogue','Sorcerer','Warlock','Wizard','Artificer',
  ]
  const RACE_OPTIONS = [
    'Human','Elf','Dwarf','Halfling','Gnome','Half-Elf',
    'Half-Orc','Tiefling','Dragonborn','Aasimar','Tabaxi','Kenku','Other',
  ]
  const COLOR_PRESETS = [
    '#FF8080','#CC1A00',  // light red, dark red
    '#FFBB66','#CC5200',  // light orange, dark orange
    '#FFE566','#997700',  // light yellow, dark yellow
    '#66DD88','#1A7A3A',  // light green, dark green
    '#66D9E8','#0A6E7A',  // light teal, dark teal
    '#66AAFF','#003DB3',  // light blue, dark blue
    '#9B99E8','#2E2B99',  // light indigo, dark indigo
    '#D499EE','#7A1FA0',  // light purple, dark purple
    '#FF99BB','#CC003D',  // light pink, dark pink
    '#FFAA80','#CC3300',  // light coral, dark coral
    '#FFFFFF',             // white
  ]

  const [form, setForm] = useState({ name: me?.name ?? '', characterName: me?.characterName ?? '', characterClass: me?.characterClass ?? 'Fighter', characterRace: me?.characterRace ?? 'Human', color: me?.color ?? COLOR_PRESETS[0], theme: me?.theme ?? 'dungeon' })

  useEffect(() => {
    if (me) setForm({ name: me.name, characterName: me.characterName, characterClass: me.characterClass, characterRace: me.characterRace, color: me.color, theme: me.theme ?? 'dungeon' })
  }, [me?.id])

  async function save() {
    if (!me) return
    const saveData = isAdmin
      ? { ...me, ...form, characterClass: 'Dungeon Master', characterRace: '' }
      : { ...me, ...form }
    await upsertPlayer(saveData)
    // Apply theme immediately without waiting for Firestore sync
    document.documentElement.setAttribute('data-theme', form.theme)
    setOpen(false)
  }

  async function handleClaim() {
    if (!myId) return
    setClaiming(true)
    setClaimError('')
    const ok = await claimAdmin(myId, pinInput || undefined)
    setClaiming(false)
    if (ok) {
      setClaimOpen(false)
      setPinInput('')
    } else {
      setClaimError(hasPIN ? 'Incorrect code.' : 'An admin already exists.')
    }
  }

  if (!me) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-dungeon-800 transition-colors"
        title="Your character"
      >
        <span className="w-6 h-6 rounded-full border-2 border-theme-700" style={{ background: me.color }} />
        <span className="hidden sm:inline text-prose-400 text-sm">{me.characterName}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setOpen(false)}>
          <div className="bg-dungeon-900 border border-theme-800 rounded-xl w-full max-w-sm mx-4 p-5 shadow-2xl flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-theme-400 font-bold" style={{ fontFamily: 'Cinzel, serif' }}>Edit Character</h3>
              <button onClick={() => setOpen(false)} className="text-prose-500 hover:text-prose-300">✕</button>
            </div>
            <input className="input-field" placeholder="Your name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <input className="input-field" placeholder="Character name" value={form.characterName} onChange={(e) => setForm((f) => ({ ...f, characterName: e.target.value }))} />
            {isAdmin ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-dungeon-900/60 rounded-lg border border-theme-900/40">
                <Crown className="w-4 h-4 text-theme-500 shrink-0" />
                <span className="text-theme-400 font-semibold text-sm">Dungeon Master</span>
              </div>
            ) : (
              <>
                <select className="input-field" value={form.characterClass} onChange={(e) => setForm((f) => ({ ...f, characterClass: e.target.value }))}>
                  {CLASS_OPTIONS.map((c) => <option key={c}>{c}</option>)}
                </select>
                <select className="input-field" value={form.characterRace} onChange={(e) => setForm((f) => ({ ...f, characterRace: e.target.value }))}>
                  {RACE_OPTIONS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </>
            )}
            <div>
              <p className="text-prose-500 text-xs mb-2">Colour</p>
              <div className="flex gap-2 flex-wrap">
                {COLOR_PRESETS.map((c) => (
                  <button key={c} onClick={() => setForm((f) => ({ ...f, color: c }))} className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                    style={{ background: c, outline: form.color === c ? `2px solid ${c === '#FFFFFF' ? '#888' : 'white'}` : 'none', outlineOffset: '2px' }} />
                ))}
              </div>
            </div>
            {/* Theme picker */}
            <div>
              <p className="text-prose-500 text-xs mb-2">Theme</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { id: 'dungeon', label: 'Dark Dungeon', bg: '#0f0c09', accent: '#d97706' },
                  { id: 'parchment', label: 'Parchment', bg: '#f8ead4', accent: '#643a10' },
                  { id: 'ocean', label: 'Ocean', bg: '#020a1c', accent: '#0280aa' },
                  { id: 'fairy', label: 'Bard / Fairy', bg: '#0c0418', accent: '#8424d2' },
                ] as const).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setForm((f) => ({ ...f, theme: t.id }))}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                      form.theme === t.id
                        ? 'border-white/40 ring-1 ring-white/30'
                        : 'border-transparent hover:border-white/20'
                    }`}
                    style={{ background: t.bg, color: t.accent }}
                  >
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: t.accent }} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={save} className="btn-primary mt-1">Save</button>

            {canBecomeAdmin && (
              <button
                onClick={() => { setOpen(false); setClaimOpen(true) }}
                className="flex items-center justify-center gap-2 text-theme-600 hover:text-theme-400 transition-colors text-sm py-1 border-t border-theme-900/30 pt-3"
              >
                <Crown className="w-4 h-4" />
                Become Admin
              </button>
            )}

            <button
              onClick={() => signOutUser()}
              className="flex items-center justify-center gap-2 text-prose-500 hover:text-red-400 transition-colors text-sm py-1"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        </div>
      )}

      {/* Become Admin modal */}
      {claimOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => { setClaimOpen(false); setPinInput(''); setClaimError('') }}>
          <div className="bg-dungeon-900 border border-theme-800 rounded-xl w-full max-w-xs mx-4 p-5 shadow-2xl flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-theme-500" />
              <h3 className="text-theme-400 font-bold" style={{ fontFamily: 'Cinzel, serif' }}>Claim Admin</h3>
            </div>
            {hasPIN ? (
              <>
                <p className="text-prose-500 text-sm">Enter the admin access code.</p>
                <input
                  className="input-field tracking-widest"
                  placeholder="Access code"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleClaim()}
                  autoFocus
                />
              </>
            ) : (
              <p className="text-prose-500 text-sm">No admin exists yet. Claim admin for this campaign?</p>
            )}
            {claimError && <p className="text-red-400 text-xs">{claimError}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleClaim}
                disabled={claiming || (hasPIN && !pinInput.trim())}
                className="flex-1 bg-theme-700 hover:bg-theme-600 text-theme-100 font-semibold rounded-lg px-4 py-2 transition-colors text-sm disabled:opacity-50"
              >
                {claiming ? 'Claiming...' : 'Claim Admin'}
              </button>
              <button onClick={() => { setClaimOpen(false); setPinInput(''); setClaimError('') }} className="text-prose-500 hover:text-prose-300 text-sm px-3">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
