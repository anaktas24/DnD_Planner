import { useState } from 'react'
import { ArrowLeft, ChevronRight, ChevronLeft, Trash2, Plus, RotateCcw, Sword, Heart } from 'lucide-react'
import { useCampaignStore } from '../store/useCampaignStore'
import { updateCampaign } from '../lib/firestore'

const PLAYER_ID_KEY = 'dnd_player_id'

type Combatant = { id: string; name: string; initiative: number; color?: string; isPlayer?: boolean; hp?: number; maxHp?: number }

interface Props {
  onBack: () => void
}

export function InitiativeTracker({ onBack }: Props) {
  const { campaign, players } = useCampaignStore()
  const myId = localStorage.getItem(PLAYER_ID_KEY)
  const myRole = myId ? (campaign?.roles?.[myId] ?? 'player') : 'player'
  const isAdmin = myRole === 'admin'

  const combatants: Combatant[] = campaign?.initiative?.combatants ?? []
  const currentIndex = campaign?.initiative?.currentIndex ?? 0

  const [newName, setNewName] = useState('')
  const [newInit, setNewInit] = useState('')
  const [newMaxHp, setNewMaxHp] = useState('')
  const [newColor, setNewColor] = useState('#cc2222')

  async function save(updated: Combatant[], idx?: number) {
    await updateCampaign({
      initiative: { combatants: updated, currentIndex: idx ?? currentIndex },
    })
  }

  async function addCombatant() {
    if (!newName.trim() || newInit === '') return
    const hp = newMaxHp ? Number(newMaxHp) : undefined
    const updated = [...combatants, {
      id: crypto.randomUUID(),
      name: newName.trim(),
      initiative: Number(newInit),
      color: newColor,
      isPlayer: false,
      hp,
      maxHp: hp,
    }].sort((a, b) => b.initiative - a.initiative)
    await save(updated, 0)
    setNewName('')
    setNewInit('')
    setNewMaxHp('')
  }

  async function addPlayer(p: typeof players[0]) {
    const initStr = prompt(`Initiative roll for ${p.characterName}?`)
    if (initStr === null || initStr.trim() === '' || isNaN(Number(initStr))) return
    const updated = [...combatants, {
      id: p.id,
      name: p.characterName,
      initiative: Number(initStr),
      color: p.color,
      isPlayer: true,
    }].sort((a, b) => b.initiative - a.initiative)
    await save(updated)
  }

  async function adjustHp(id: string, delta: number) {
    const updated = combatants.map((c) =>
      c.id === id && c.hp !== undefined
        ? { ...c, hp: Math.max(0, Math.min(c.maxHp ?? 9999, c.hp + delta)) }
        : c
    )
    await save(updated)
  }

  async function setHpDirect(id: string, value: number) {
    const updated = combatants.map((c) =>
      c.id === id ? { ...c, hp: Math.max(0, Math.min(c.maxHp ?? 9999, value)) } : c
    )
    await save(updated)
  }

  async function remove(id: string) {
    const updated = combatants.filter((c) => c.id !== id)
    await save(updated, Math.min(currentIndex, Math.max(0, updated.length - 1)))
  }

  async function next() {
    if (combatants.length === 0) return
    await save(combatants, (currentIndex + 1) % combatants.length)
  }

  async function prev() {
    if (combatants.length === 0) return
    await save(combatants, (currentIndex - 1 + combatants.length) % combatants.length)
  }

  async function reset() {
    if (!confirm('Clear all combatants and reset initiative?')) return
    await save([], 0)
  }

  const alreadyAdded = new Set(combatants.map((c) => c.id))
  const availablePlayers = players.filter((p) => !alreadyAdded.has(p.id))

  function hpColor(hp: number, maxHp: number) {
    const pct = hp / maxHp
    if (pct <= 0) return 'text-prose-600'
    if (pct <= 0.25) return 'text-red-400'
    if (pct <= 0.5) return 'text-theme-400'
    return 'text-emerald-400'
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
      <div className="max-w-2xl w-full mx-auto px-4 py-6 flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-prose-500 hover:text-theme-400 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <Sword className="w-5 h-5 text-theme-500" />
            <h2 className="text-2xl font-bold text-theme-400" style={{ fontFamily: 'Cinzel, serif' }}>
              Initiative Tracker
            </h2>
          </div>
          {isAdmin && combatants.length > 0 && (
            <button onClick={reset} className="flex items-center gap-1.5 text-xs text-prose-500 hover:text-red-400 transition-colors">
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>

        {/* Turn controls */}
        {combatants.length > 0 && (
          <div className="flex items-center justify-center gap-4">
            {isAdmin && (
              <button onClick={prev} className="p-2 rounded-lg text-prose-500 hover:text-theme-400 hover:bg-dungeon-800 transition-colors">
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            <div className="text-center">
              <p className="text-prose-500 text-xs uppercase tracking-wider mb-0.5">Current Turn</p>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: combatants[currentIndex]?.color ?? '#888' }} />
                <p className="text-theme-300 font-bold text-xl" style={{ fontFamily: 'Cinzel, serif' }}>
                  {combatants[currentIndex]?.name}
                </p>
              </div>
              <p className="text-prose-600 text-xs mt-0.5">{currentIndex + 1} / {combatants.length}</p>
            </div>
            {isAdmin && (
              <button onClick={next} className="p-2 rounded-lg text-prose-500 hover:text-theme-400 hover:bg-dungeon-800 transition-colors">
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>
        )}

        {/* Combatant list */}
        {combatants.length === 0 ? (
          <div className="text-center py-12">
            <Sword className="w-10 h-10 text-prose-700 mx-auto mb-3" />
            <p className="text-prose-600 text-sm italic">No combatants yet. Roll for initiative!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {combatants.map((c, i) => {
              const isDead = !c.isPlayer && c.hp !== undefined && c.hp <= 0
              return (
                <div
                  key={c.id}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                    isDead ? 'opacity-40 border-prose-800 bg-dungeon-900' :
                    i === currentIndex
                      ? 'border-theme-500 bg-theme-900/20 shadow-lg'
                      : 'border-theme-900/30 bg-dungeon-800'
                  }`}
                >
                  {/* Initiative badge */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${
                    i === currentIndex && !isDead ? 'bg-theme-700 text-theme-100' : 'bg-dungeon-900 text-prose-400'
                  }`}>
                    {c.initiative}
                  </div>

                  {/* Color dot + name */}
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: c.color ?? '#888' }} />
                  <p className={`font-semibold flex-1 truncate ${i === currentIndex && !isDead ? 'text-theme-300' : isDead ? 'text-prose-600 line-through' : 'text-prose-200'}`}
                    style={{ fontFamily: 'Cinzel, serif' }}>
                    {c.name}
                  </p>

                  {/* HP section — creatures only */}
                  {!c.isPlayer && c.maxHp !== undefined && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Heart className={`w-3.5 h-3.5 ${hpColor(c.hp ?? 0, c.maxHp)}`} />
                      {isAdmin ? (
                        <>
                          <button onClick={() => adjustHp(c.id, -5)} className="text-xs px-1.5 py-0.5 rounded bg-dungeon-900 text-prose-400 hover:text-red-400 hover:bg-red-950 transition-colors">-5</button>
                          <button onClick={() => adjustHp(c.id, -1)} className="text-xs px-1.5 py-0.5 rounded bg-dungeon-900 text-prose-400 hover:text-red-400 hover:bg-red-950 transition-colors">-1</button>
                          <input
                            type="number"
                            value={c.hp ?? 0}
                            onChange={(e) => setHpDirect(c.id, Number(e.target.value))}
                            className="w-12 text-center text-sm bg-dungeon-900 border border-theme-900/40 rounded px-1 py-0.5 text-prose-200 focus:outline-none focus:border-theme-600"
                          />
                          <span className={`text-xs ${hpColor(c.hp ?? 0, c.maxHp)}`}>/{c.maxHp}</span>
                          <button onClick={() => adjustHp(c.id, 1)} className="text-xs px-1.5 py-0.5 rounded bg-dungeon-900 text-prose-400 hover:text-emerald-400 hover:bg-emerald-950 transition-colors">+1</button>
                          <button onClick={() => adjustHp(c.id, 5)} className="text-xs px-1.5 py-0.5 rounded bg-dungeon-900 text-prose-400 hover:text-emerald-400 hover:bg-emerald-950 transition-colors">+5</button>
                        </>
                      ) : (
                        <span className={`text-sm font-semibold ${hpColor(c.hp ?? 0, c.maxHp)}`}>
                          {c.hp}/{c.maxHp}
                        </span>
                      )}
                    </div>
                  )}

                  {i === currentIndex && !isDead && (
                    <span className="text-xs text-theme-500 font-semibold uppercase tracking-wider shrink-0">Active</span>
                  )}
                  {isDead && (
                    <span className="text-xs text-prose-600 font-semibold uppercase tracking-wider shrink-0">Dead</span>
                  )}

                  {isAdmin && (
                    <button onClick={() => remove(c.id)} className="text-prose-600 hover:text-red-400 transition-colors shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Admin controls */}
        {isAdmin && (
          <div className="flex flex-col gap-4">
            {/* Quick-add players */}
            {availablePlayers.length > 0 && (
              <div className="bg-dungeon-800 border border-theme-900/30 rounded-xl p-4">
                <p className="text-prose-500 text-xs uppercase tracking-wider mb-3">Quick-add player</p>
                <div className="flex flex-wrap gap-2">
                  {availablePlayers.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => addPlayer(p)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-theme-900/40 hover:border-theme-600 hover:bg-dungeon-700 transition-colors text-sm"
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                      <span className="text-prose-300">{p.characterName}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add creature */}
            <div className="bg-dungeon-800 border border-theme-900/30 rounded-xl p-4 flex flex-col gap-3">
              <p className="text-prose-500 text-xs uppercase tracking-wider">Add creature / NPC</p>
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
                />
                <input
                  className="input-field w-20 text-center"
                  placeholder="HP"
                  type="number"
                  value={newMaxHp}
                  onChange={(e) => setNewMaxHp(e.target.value)}
                />
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-theme-900/60 bg-dungeon-900 cursor-pointer p-0.5 shrink-0"
                />
                <button
                  onClick={addCombatant}
                  disabled={!newName.trim() || newInit === ''}
                  className="p-2 bg-theme-700 hover:bg-theme-600 text-theme-100 rounded-lg transition-colors disabled:opacity-40 shrink-0"
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
