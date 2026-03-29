import { useState } from 'react'
import { UserPlus, X } from 'lucide-react'
import { useCampaignStore } from '../store/useCampaignStore'
import { upsertPlayer } from '../lib/firestore'

const CLASS_OPTIONS = [
  'Barbarian','Bard','Cleric','Druid','Fighter','Monk',
  'Paladin','Ranger','Rogue','Sorcerer','Warlock','Wizard','Artificer',
]

const COLOR_PRESETS = [
  '#e63946','#f4a261','#2a9d8f','#457b9d','#a8dadc',
  '#e9c46a','#9b5de5','#f15bb5','#00bbf9','#00f5d4',
]

const BLANK_FORM = {
  name: '',
  characterName: '',
  characterClass: 'Fighter',
  color: COLOR_PRESETS[0],
}

export function PlayerRoster() {
  const { players, activePlayerId, setActivePlayer } = useCampaignStore()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(BLANK_FORM)

  async function addPlayer() {
    if (!form.name.trim()) return
    const id = await upsertPlayer({
      ...form,
      availability: [],
      confirmedDates: [],
      declinedDates: [],
    })
    setActivePlayer(id)
    setForm(BLANK_FORM)
    setShowForm(false)
  }

  return (
    <aside className="w-72 shrink-0 bg-dungeon-900 border-r border-amber-900 p-4 flex flex-col gap-4">
      <h2 className="text-amber-500 font-bold uppercase tracking-widest text-xs">
        Adventurers
      </h2>

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
              <p className="text-amber-100 font-medium text-sm truncate">{p.characterName || p.name}</p>
              <p className="text-stone-500 text-xs">{p.name} · {p.characterClass}</p>
            </div>
          </button>
        ))}
      </div>

      {showForm ? (
        <div className="bg-dungeon-800 rounded-lg p-3 flex flex-col gap-2 border border-amber-900">
          <div className="flex justify-between items-center">
            <span className="text-amber-500 text-xs font-bold uppercase tracking-wider">New Adventurer</span>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-stone-500" /></button>
          </div>
          <input
            className="input-field"
            placeholder="Player name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <input
            className="input-field"
            placeholder="Character name"
            value={form.characterName}
            onChange={(e) => setForm((f) => ({ ...f, characterName: e.target.value }))}
          />
          <select
            className="input-field"
            value={form.characterClass}
            onChange={(e) => setForm((f) => ({ ...f, characterClass: e.target.value }))}
          >
            {CLASS_OPTIONS.map((c) => <option key={c}>{c}</option>)}
          </select>
          <div className="flex gap-1 flex-wrap">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                onClick={() => setForm((f) => ({ ...f, color: c }))}
                className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                style={{
                  background: c,
                  outline: form.color === c ? `2px solid white` : 'none',
                  outlineOffset: '2px',
                }}
              />
            ))}
          </div>
          <button
            onClick={addPlayer}
            className="btn-primary text-sm mt-1"
          >
            Add to Party
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 text-amber-600 hover:text-amber-400 text-sm transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Add adventurer
        </button>
      )}
    </aside>
  )
}
