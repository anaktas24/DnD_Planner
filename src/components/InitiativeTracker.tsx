import { useState } from 'react'
import { ArrowLeft, ChevronRight, ChevronLeft, Trash2, Plus, RotateCcw, Sword } from 'lucide-react'
import { useCampaignStore } from '../store/useCampaignStore'
import { updateCampaign } from '../lib/firestore'

const PLAYER_ID_KEY = 'dnd_player_id'

interface Props {
  onBack: () => void
}

export function InitiativeTracker({ onBack }: Props) {
  const { campaign, players } = useCampaignStore()
  const myId = localStorage.getItem(PLAYER_ID_KEY)
  const myRole = myId ? (campaign?.roles?.[myId] ?? 'player') : 'player'
  const isAdmin = myRole === 'admin'

  const combatants = campaign?.initiative?.combatants ?? []
  const currentIndex = campaign?.initiative?.currentIndex ?? 0

  const [newName, setNewName] = useState('')
  const [newInit, setNewInit] = useState('')
  const [newColor, setNewColor] = useState('#888888')

  async function addCombatant() {
    if (!newName.trim() || newInit === '') return
    const updated = [...combatants, {
      id: crypto.randomUUID(),
      name: newName.trim(),
      initiative: Number(newInit),
      color: newColor,
    }].sort((a, b) => b.initiative - a.initiative)
    await updateCampaign({ initiative: { combatants: updated, currentIndex: 0 } })
    setNewName('')
    setNewInit('')
  }

  async function addPlayer(p: typeof players[0]) {
    const initStr = prompt(`Initiative roll for ${p.characterName}?`)
    if (initStr === null || initStr.trim() === '' || isNaN(Number(initStr))) return
    const updated = [...combatants, {
      id: p.id,
      name: p.characterName,
      initiative: Number(initStr),
      color: p.color,
    }].sort((a, b) => b.initiative - a.initiative)
    await updateCampaign({ initiative: { combatants: updated, currentIndex } })
  }

  async function remove(id: string) {
    const updated = combatants.filter((c) => c.id !== id)
    const newIdx = Math.min(currentIndex, Math.max(0, updated.length - 1))
    await updateCampaign({ initiative: { combatants: updated, currentIndex: newIdx } })
  }

  async function next() {
    if (combatants.length === 0) return
    await updateCampaign({ initiative: { combatants, currentIndex: (currentIndex + 1) % combatants.length } })
  }

  async function prev() {
    if (combatants.length === 0) return
    await updateCampaign({ initiative: { combatants, currentIndex: (currentIndex - 1 + combatants.length) % combatants.length } })
  }

  async function reset() {
    if (!confirm('Clear all combatants and reset initiative?')) return
    await updateCampaign({ initiative: { combatants: [], currentIndex: 0 } })
  }

  const alreadyAdded = new Set(combatants.map((c) => c.id))
  const availablePlayers = players.filter((p) => !alreadyAdded.has(p.id))

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
      <div className="max-w-2xl w-full mx-auto px-4 py-6 flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-stone-500 hover:text-amber-400 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <Sword className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-amber-400" style={{ fontFamily: 'Cinzel, serif' }}>
              Initiative Tracker
            </h2>
          </div>
          {isAdmin && combatants.length > 0 && (
            <button onClick={reset} className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-red-400 transition-colors">
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>

        {/* Turn controls */}
        {combatants.length > 0 && (
          <div className="flex items-center justify-center gap-4">
            {isAdmin && (
              <button onClick={prev} className="p-2 rounded-lg text-stone-500 hover:text-amber-400 hover:bg-dungeon-800 transition-colors">
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            <div className="text-center">
              <p className="text-stone-500 text-xs uppercase tracking-wider mb-0.5">Current Turn</p>
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ background: combatants[currentIndex]?.color ?? '#888' }}
                />
                <p className="text-amber-300 font-bold text-xl" style={{ fontFamily: 'Cinzel, serif' }}>
                  {combatants[currentIndex]?.name}
                </p>
              </div>
              <p className="text-stone-600 text-xs mt-0.5">
                {currentIndex + 1} / {combatants.length}
              </p>
            </div>
            {isAdmin && (
              <button onClick={next} className="p-2 rounded-lg text-stone-500 hover:text-amber-400 hover:bg-dungeon-800 transition-colors">
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>
        )}

        {/* Combatant list */}
        {combatants.length === 0 ? (
          <div className="text-center py-12">
            <Sword className="w-10 h-10 text-stone-700 mx-auto mb-3" />
            <p className="text-stone-600 text-sm italic">No combatants yet. Roll for initiative!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {combatants.map((c, i) => (
              <div
                key={c.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                  i === currentIndex
                    ? 'border-amber-500 bg-amber-900/20 shadow-lg'
                    : 'border-amber-900/30 bg-dungeon-800'
                }`}
              >
                {/* Initiative number */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${
                  i === currentIndex ? 'bg-amber-700 text-amber-100' : 'bg-dungeon-900 text-stone-400'
                }`}>
                  {c.initiative}
                </div>

                {/* Name + color dot */}
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: c.color ?? '#888' }} />
                <p className={`font-semibold flex-1 truncate ${i === currentIndex ? 'text-amber-300' : 'text-stone-200'}`}
                  style={{ fontFamily: 'Cinzel, serif' }}>
                  {c.name}
                </p>

                {/* Current turn badge */}
                {i === currentIndex && (
                  <span className="text-xs text-amber-500 font-semibold uppercase tracking-wider shrink-0">Active</span>
                )}

                {isAdmin && (
                  <button
                    onClick={() => remove(c.id)}
                    className="text-stone-600 hover:text-red-400 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Admin controls */}
        {isAdmin && (
          <div className="flex flex-col gap-4">
            {/* Quick-add players */}
            {availablePlayers.length > 0 && (
              <div className="bg-dungeon-800 border border-amber-900/30 rounded-xl p-4">
                <p className="text-stone-500 text-xs uppercase tracking-wider mb-3">Quick-add player</p>
                <div className="flex flex-wrap gap-2">
                  {availablePlayers.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => addPlayer(p)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-900/40 hover:border-amber-600 hover:bg-dungeon-700 transition-colors text-sm"
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                      <span className="text-stone-300">{p.characterName}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add custom combatant */}
            <div className="bg-dungeon-800 border border-amber-900/30 rounded-xl p-4 flex flex-col gap-3">
              <p className="text-stone-500 text-xs uppercase tracking-wider">Add combatant</p>
              <div className="flex gap-2">
                <input
                  className="input-field flex-1"
                  placeholder="Name (e.g. Goblin #1)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCombatant()}
                />
                <input
                  className="input-field w-20 text-center"
                  placeholder="Init"
                  type="number"
                  value={newInit}
                  onChange={(e) => setNewInit(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCombatant()}
                />
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-amber-900/60 bg-dungeon-900 cursor-pointer p-0.5"
                />
                <button
                  onClick={addCombatant}
                  disabled={!newName.trim() || newInit === ''}
                  className="p-2 bg-amber-700 hover:bg-amber-600 text-amber-100 rounded-lg transition-colors disabled:opacity-40"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
