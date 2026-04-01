import { useState } from 'react'
import { Sword } from 'lucide-react'
import { upsertPlayer } from '../lib/firestore'
import { useCampaignStore } from '../store/useCampaignStore'

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

interface Props {
  onJoined: (playerId: string) => void
}

export function JoinScreen({ onJoined }: Props) {
  const players = useCampaignStore((s) => s.players)
  const [form, setForm] = useState({
    name: '',
    characterName: '',
    characterClass: 'Fighter',
    characterRace: 'Human',
    color: COLOR_PRESETS[0],
  })
  const [loading, setLoading] = useState(false)

  // Pick a color not already taken
  const takenColors = new Set(players.map((p) => p.color))
  const defaultColor = COLOR_PRESETS.find((c) => !takenColors.has(c)) ?? COLOR_PRESETS[0]
  if (form.color === COLOR_PRESETS[0] && defaultColor !== COLOR_PRESETS[0]) {
    setForm((f) => ({ ...f, color: defaultColor }))
  }

  async function join() {
    if (!form.name.trim() || !form.characterName.trim()) return
    setLoading(true)
    const id = await upsertPlayer({
      ...form,
      availability: [],
      confirmedDates: [],
      declinedDates: [],
    })
    onJoined(id)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-dungeon-900 flex items-center justify-center p-6">
      <div className="bg-dungeon-800 border border-amber-800 rounded-2xl p-8 w-full max-w-sm shadow-2xl flex flex-col gap-5">
        <div className="text-center">
          <Sword className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-amber-400" style={{ fontFamily: 'Cinzel Decorative, serif' }}>
            DnD Planner
          </h1>
          <p className="text-stone-500 text-sm mt-1">Who are you, adventurer?</p>
        </div>

        <input
          className="input-field"
          placeholder="Your name (player)"
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
        <select
          className="input-field"
          value={form.characterRace}
          onChange={(e) => setForm((f) => ({ ...f, characterRace: e.target.value }))}
        >
          {RACE_OPTIONS.map((r) => <option key={r}>{r}</option>)}
        </select>

        <div>
          <p className="text-stone-500 text-xs mb-2">Pick your colour</p>
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
                  opacity: takenColors.has(c) && form.color !== c ? 0.3 : 1,
                }}
              />
            ))}
          </div>
        </div>

        <button
          onClick={join}
          disabled={!form.name.trim() || !form.characterName.trim() || loading}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Entering...' : 'Enter the Campaign'}
        </button>
      </div>
    </div>
  )
}
