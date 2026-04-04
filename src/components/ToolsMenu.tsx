import { useState, useRef, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import {
  Settings, Play, XCircle, PlusCircle, ScrollText,
  Trash2, UserX, Copy, Check, Shield, Bell, Send, LogOut, PartyPopper,
} from 'lucide-react'
import { useCampaignStore } from '../store/useCampaignStore'
import { updateCampaign, clearAllAvailability, sendNotification } from '../lib/firestore'
import { signOutUser } from '../lib/firebase'

type View = 'home' | 'blog' | 'admin'

interface ToolsMenuProps {
  onNavigate: (view: View) => void
}

export function ToolsMenu({ onNavigate }: ToolsMenuProps) {
  const [open, setOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [reminderOpen, setReminderOpen] = useState(false)
  const [reminderText, setReminderText] = useState('')
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const { campaign, players, notes, allGreenDates } = useCampaignStore()
  const greenDates = allGreenDates()

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Who hasn't marked any dates
  const missing = players.filter((p) => p.availability.length === 0)

  async function startCountdown() {
    if (greenDates.length === 1) {
      await updateCampaign({ nextSessionDate: greenDates[0] })
    }
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

  async function sessionComplete() {
    if (!confirm('Mark session as complete? This will bump the session count, clear all availability, and reset the date and votes.')) return
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
    await clearAllAvailability()
    setOpen(false)
  }

  async function clearAvailability() {
    if (!confirm('Clear all players\' availability for a fresh month?')) return
    await clearAllAvailability()
    await updateCampaign({ nextSessionDate: null, dateVotes: {} })
    setOpen(false)
  }

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

  async function sendReminder() {
    if (!reminderText.trim()) return
    await sendNotification(reminderText.trim())
    setReminderText('')
    setReminderOpen(false)
  }

  const items = [
    {
      icon: PartyPopper,
      label: 'Session complete!',
      sublabel: 'Bump count, clear dates & availability',
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
      label: 'Session +1',
      sublabel: `Bump to #${(campaign?.sessionCount ?? 0) + 1}`,
      onClick: bumpSession,
      disabled: false,
    },
    {
      icon: copied ? Check : Copy,
      label: copied ? 'Copied!' : 'Copy Discord summary',
      sublabel: 'Paste into your channel',
      onClick: copyDiscordSummary,
      disabled: false,
    },
    {
      icon: ScrollText,
      label: 'Session history',
      sublabel: `${notes.length} session${notes.length !== 1 ? 's' : ''} logged`,
      onClick: () => { setHistoryOpen(true); setOpen(false) },
      disabled: notes.length === 0,
    },
    {
      icon: Trash2,
      label: 'Clear all availability',
      sublabel: 'Fresh start for new month',
      onClick: clearAvailability,
      disabled: false,
      danger: true,
    },
    {
      icon: Send,
      label: 'Post to Discord',
      sublabel: 'Send current session info to Discord',
      onClick: postToDiscord,
      disabled: !campaign?.discordWebhookUrl,
    },
    {
      icon: Bell,
      label: 'Send Reminder',
      sublabel: 'Push a notification to all players',
      onClick: () => { setReminderOpen(true); setOpen(false) },
      disabled: false,
    },
    {
      icon: Shield,
      label: 'Admin Panel',
      sublabel: 'Manage campaign & players',
      onClick: () => { onNavigate('admin'); setOpen(false) },
      disabled: false,
    },
  ]

  return (
    <>
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((o) => !o)}
          className={`p-2 rounded-lg transition-colors ${open ? 'bg-amber-900/40 text-amber-400' : 'text-stone-500 hover:text-amber-400'}`}
          title="Tools"
        >
          <Settings className="w-5 h-5" />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-dungeon-800 border border-amber-800 rounded-xl shadow-2xl z-50 overflow-hidden">
            {/* Who's missing */}
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
                  ${item.danger ? 'hover:bg-red-900/30' : item.highlight ? 'hover:bg-emerald-900/30' : 'hover:bg-dungeon-700'}`}
              >
                <item.icon className={`w-4 h-4 shrink-0 ${item.danger ? 'text-red-500' : item.highlight ? 'text-emerald-400' : 'text-amber-600'}`} />
                <div>
                  <p className={`text-sm font-medium ${item.danger ? 'text-red-400' : item.highlight ? 'text-emerald-300' : 'text-stone-200'}`}>{item.label}</p>
                  <p className="text-stone-600 text-xs">{item.sublabel}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Send reminder modal */}
      {reminderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setReminderOpen(false)}>
          <div className="bg-dungeon-900 border border-amber-800 rounded-xl w-full max-w-sm mx-4 p-5 shadow-2xl flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-amber-400 font-bold" style={{ fontFamily: 'Cinzel, serif' }}>Send Reminder</h3>
              <button onClick={() => setReminderOpen(false)} className="text-stone-500 hover:text-stone-300">✕</button>
            </div>
            <textarea
              className="input-field resize-none"
              rows={3}
              placeholder="e.g. Session this Saturday at 7pm — mark your dates!"
              value={reminderText}
              onChange={(e) => setReminderText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendReminder())}
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={sendReminder} disabled={!reminderText.trim()} className="btn-primary flex-1 disabled:opacity-50">
                Send
              </button>
              <button onClick={() => setReminderOpen(false)} className="text-stone-500 hover:text-stone-300 px-3 text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session history modal */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setHistoryOpen(false)}>
          <div className="bg-dungeon-900 border border-amber-800 rounded-xl w-full max-w-md mx-4 p-5 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-amber-400 font-bold" style={{ fontFamily: 'Cinzel, serif' }}>Session History</h3>
              <button onClick={() => setHistoryOpen(false)} className="text-stone-500 hover:text-stone-300">✕</button>
            </div>
            {notes.length === 0 ? (
              <p className="text-stone-600 text-sm italic">No sessions logged yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {[...notes].sort((a, b) => b.sessionNumber - a.sessionNumber).map((n) => (
                  <div key={n.id} className="bg-dungeon-800 rounded-lg p-3 border border-amber-900/30">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-amber-500 font-semibold text-xs uppercase tracking-wider">Session #{n.sessionNumber}</span>
                      <span className="text-stone-600 text-xs">{format(parseISO(n.date), 'MMM d, yyyy')}</span>
                    </div>
                    {n.summary && <p className="text-stone-300 text-sm mb-1">{n.summary}</p>}
                    {n.location && <p className="text-stone-500 text-xs">📍 {n.location}</p>}
                    {n.nextLocation && <p className="text-stone-500 text-xs">➡️ Next: {n.nextLocation}</p>}
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
  const players = useCampaignStore((s) => s.players)
  const myId = useCampaignStore((s) => s.activePlayerId)
  const me = players.find((p) => p.id === myId)

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
  ]

  const [form, setForm] = useState({ name: me?.name ?? '', characterName: me?.characterName ?? '', characterClass: me?.characterClass ?? 'Fighter', characterRace: me?.characterRace ?? 'Human', color: me?.color ?? COLOR_PRESETS[0] })

  useEffect(() => {
    if (me) setForm({ name: me.name, characterName: me.characterName, characterClass: me.characterClass, characterRace: me.characterRace, color: me.color })
  }, [me?.id])

  async function save() {
    if (!me) return
    const { upsertPlayer } = await import('../lib/firestore')
    await upsertPlayer({ ...me, ...form })
    setOpen(false)
  }

  if (!me) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-dungeon-800 transition-colors"
        title="Your character"
      >
        <span className="w-6 h-6 rounded-full border-2 border-amber-700" style={{ background: me.color }} />
        <span className="hidden sm:inline text-stone-400 text-sm">{me.characterName}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setOpen(false)}>
          <div className="bg-dungeon-900 border border-amber-800 rounded-xl w-full max-w-sm mx-4 p-5 shadow-2xl flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-amber-400 font-bold" style={{ fontFamily: 'Cinzel, serif' }}>Edit Character</h3>
              <button onClick={() => setOpen(false)} className="text-stone-500 hover:text-stone-300">✕</button>
            </div>
            <input className="input-field" placeholder="Your name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <input className="input-field" placeholder="Character name" value={form.characterName} onChange={(e) => setForm((f) => ({ ...f, characterName: e.target.value }))} />
            <select className="input-field" value={form.characterClass} onChange={(e) => setForm((f) => ({ ...f, characterClass: e.target.value }))}>
              {CLASS_OPTIONS.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select className="input-field" value={form.characterRace} onChange={(e) => setForm((f) => ({ ...f, characterRace: e.target.value }))}>
              {RACE_OPTIONS.map((r) => <option key={r}>{r}</option>)}
            </select>
            <div>
              <p className="text-stone-500 text-xs mb-2">Colour</p>
              <div className="flex gap-2 flex-wrap">
                {COLOR_PRESETS.map((c) => (
                  <button key={c} onClick={() => setForm((f) => ({ ...f, color: c }))} className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                    style={{ background: c, outline: form.color === c ? '2px solid white' : 'none', outlineOffset: '2px' }} />
                ))}
              </div>
            </div>
            <button onClick={save} className="btn-primary mt-1">Save</button>
            <button
              onClick={() => { setOpen(false); signOutUser() }}
              className="flex items-center justify-center gap-2 w-full text-stone-500 hover:text-red-400 text-sm py-1 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </>
  )
}
