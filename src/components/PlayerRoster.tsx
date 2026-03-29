import { useState } from 'react'
import { Settings, X } from 'lucide-react'
import { useCampaignStore } from '../store/useCampaignStore'
import { upsertPlayer } from '../lib/firestore'
import type { Player } from '../types'

const CLASS_OPTIONS = [
  'Barbarian','Bard','Cleric','Druid','Fighter','Monk',
  'Paladin','Ranger','Rogue','Sorcerer','Warlock','Wizard','Artificer',
]

const RACE_OPTIONS = [
  'Human','Elf','Dwarf','Halfling','Gnome','Half-Elf',
  'Half-Orc','Tiefling','Dragonborn','Aasimar','Tabaxi','Kenku','Other',
]

const COLOR_PRESETS = [
  '#e63946','#f4a261','#2a9d8f','#457b9d','#a8dadc',
  '#e9c46a','#9b5de5','#f15bb5','#00bbf9','#00f5d4',
]

const PLAYER_ID_KEY = 'dnd_player_id'

export function PlayerRoster() {
  const { players, activePlayerId, setActivePlayer } = useCampaignStore()
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [form, setForm] = useState<Partial<Player>>({})

  const myId = localStorage.getItem(PLAYER_ID_KEY)

  function openEdit() {
    const me = players.find((p) => p.id === myId)
    if (!me) return
    setEditingPlayer(me)
    setForm({ name: me.name, characterName: me.characterName, characterClass: me.characterClass, characterRace: me.characterRace, color: me.color })
  }

  async function save() {
    if (!editingPlayer) return
    await upsertPlayer({ ...editingPlayer, ...form })
    setEditingPlayer(null)
  }

  return (
    <aside className="w-64 shrink-0 bg-dungeon-900 border-r border-amber-900 p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-amber-500 font-bold uppercase tracking-widest text-xs">
          Adventurers
        </h2>
        {myId && (
          <button onClick={openEdit} className="text-stone-600 hover:text-amber-500 transition-colors" title="Edit your character">
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {players.map((p) => (
          <button
            key={p.id}
            onClick={() => setActivePlayer(activePlayerId === p.id ? null : p.id)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
              activePlayerId === p.id
                ? 'bg-amber-900/40 ring-1 ring-amber-600'
                : 'hover:bg-dungeon-800'
            }`}
          >
            <span
              className="w-3 h-3 rounded-full shrink-0 ring-2 ring-black/30"
              style={{ background: p.color }}
            />
            <div className="min-w-0">
              <p className="text-amber-100 font-medium text-sm truncate">{p.characterName}</p>
              <p className="text-stone-500 text-xs truncate">
                {p.characterRace} {p.characterClass}
              </p>
              <p className="text-stone-600 text-xs truncate">{p.name}</p>
            </div>
          </button>
        ))}

        {players.length === 0 && (
          <p className="text-stone-600 text-xs italic">No adventurers yet...</p>
        )}
      </div>

      {/* Edit modal */}
      {editingPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setEditingPlayer(null)}>
          <div className="bg-dungeon-900 border border-amber-800 rounded-xl w-full max-w-sm mx-4 p-5 shadow-2xl flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-amber-400 font-bold" style={{ fontFamily: 'Cinzel, serif' }}>Edit Character</h3>
              <button onClick={() => setEditingPlayer(null)}><X className="w-5 h-5 text-stone-500 hover:text-stone-300" /></button>
            </div>
            <input className="input-field" placeholder="Your name (player)" value={form.name ?? ''} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <input className="input-field" placeholder="Character name" value={form.characterName ?? ''} onChange={(e) => setForm((f) => ({ ...f, characterName: e.target.value }))} />
            <select className="input-field" value={form.characterClass ?? 'Fighter'} onChange={(e) => setForm((f) => ({ ...f, characterClass: e.target.value }))}>
              {CLASS_OPTIONS.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select className="input-field" value={form.characterRace ?? 'Human'} onChange={(e) => setForm((f) => ({ ...f, characterRace: e.target.value }))}>
              {RACE_OPTIONS.map((r) => <option key={r}>{r}</option>)}
            </select>
            <div>
              <p className="text-stone-500 text-xs mb-2">Colour</p>
              <div className="flex gap-2 flex-wrap">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                    className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                    style={{
                      background: c,
                      outline: form.color === c ? '2px solid white' : 'none',
                      outlineOffset: '2px',
                    }}
                  />
                ))}
              </div>
            </div>
            <button onClick={save} className="btn-primary mt-1">Save</button>
          </div>
        </div>
      )}
    </aside>
  )
}
