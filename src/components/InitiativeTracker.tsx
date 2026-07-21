import { useState, useRef } from 'react'
import { Sword, X, ChevronRight, Plus, SkipForward, Trash2, GripVertical } from 'lucide-react'

interface Combatant {
  id: string
  name: string
  initiative: number
  hp: number
  maxHp: number
  conditions: string[]
}

const ALL_CONDITIONS = [
  'Poisoned', 'Stunned', 'Prone', 'Blinded', 'Frightened',
  'Grappled', 'Paralyzed', 'Burning', 'Invisible', 'Concentrating', 'Exhausted', 'Incapacitated',
]

const CONDITION_COLORS: Record<string, string> = {
  Poisoned: '#4ade80',
  Stunned: '#facc15',
  Prone: '#a78bfa',
  Blinded: '#94a3b8',
  Frightened: '#f87171',
  Grappled: '#fb923c',
  Paralyzed: '#60a5fa',
  Burning: '#f97316',
  Invisible: '#e2e8f0',
  Concentrating: '#c084fc',
  Exhausted: '#6b7280',
  Incapacitated: '#ef4444',
}

export function InitiativeTracker() {
  const [open, setOpen] = useState(false)
  const [combatants, setCombatants] = useState<Combatant[]>([])
  const [currentTurn, setCurrentTurn] = useState(0)
  const [round, setRound] = useState(1)
  const [name, setName] = useState('')
  const [initiative, setInitiative] = useState('')
  const [hp, setHp] = useState('')
  const [conditionPicker, setConditionPicker] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const dragIndexRef = useRef<number | null>(null)

  function addCombatant() {
    if (!name.trim()) return
    const newC: Combatant = {
      id: crypto.randomUUID(),
      name: name.trim(),
      initiative: parseInt(initiative) || 0,
      hp: parseInt(hp) || 0,
      maxHp: parseInt(hp) || 0,
      conditions: [],
    }
    setCombatants((prev) => {
      const insertAt = prev.findIndex((c) => c.initiative < newC.initiative)
      if (insertAt === -1) return [...prev, newC]
      const next = [...prev]
      next.splice(insertAt, 0, newC)
      return next
    })
    setName('')
    setInitiative('')
    setHp('')
    nameRef.current?.focus()
  }

  function nextTurn() {
    const next = currentTurn + 1
    if (next >= combatants.length) {
      setCurrentTurn(0)
      setRound((r) => r + 1)
    } else {
      setCurrentTurn(next)
    }
  }

  function toggleCondition(id: string, condition: string) {
    setCombatants((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, conditions: c.conditions.includes(condition) ? c.conditions.filter((x) => x !== condition) : [...c.conditions, condition] }
          : c
      )
    )
  }

  function removeCombatant(id: string) {
    setCombatants((prev) => prev.filter((c) => c.id !== id))
    setCurrentTurn(0)
  }

  function clearAll() {
    if (!confirm('End combat and clear all combatants?')) return
    setCombatants([])
    setCurrentTurn(0)
    setRound(1)
  }

  function handleDragStart(index: number) {
    dragIndexRef.current = index
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    setDragOverIndex(index)
  }

  function handleDrop(e: React.DragEvent, toIndex: number) {
    e.preventDefault()
    const fromIndex = dragIndexRef.current
    if (fromIndex === null || fromIndex === toIndex) {
      setDragOverIndex(null)
      return
    }
    const activeId = combatants[currentTurn]?.id
    const next = [...combatants]
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)
    const newTurn = activeId ? next.findIndex((c) => c.id === activeId) : 0
    setCombatants(next)
    setCurrentTurn(newTurn >= 0 ? newTurn : 0)
    dragIndexRef.current = null
    setDragOverIndex(null)
  }

  function handleDragEnd() {
    dragIndexRef.current = null
    setDragOverIndex(null)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative p-2 rounded-lg text-stone-500 hover:text-amber-400 transition-colors"
        title="Initiative Tracker"
      >
        <Sword className="w-5 h-5" />
        {combatants.length > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 overflow-y-auto" onClick={() => setOpen(false)}>
          <div
            className="bg-dungeon-900 border border-amber-800 rounded-xl w-full max-w-md mx-4 my-4 shadow-2xl flex flex-col gap-4 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sword className="w-5 h-5 text-amber-500" />
                <h3 className="text-amber-400 font-bold" style={{ fontFamily: 'Cinzel, serif' }}>Initiative</h3>
                <span className="text-stone-500 text-sm">Round <span className="text-amber-400 font-bold">{round}</span></span>
              </div>
              <div className="flex items-center gap-2">
                {combatants.length > 0 && (
                  <button onClick={clearAll} className="p-1.5 text-stone-600 hover:text-red-400 transition-colors" title="End combat">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-stone-500 hover:text-stone-300">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick add */}
            <div className="flex gap-2">
              <input
                ref={nameRef}
                className="input-field flex-1 text-sm"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCombatant()}
              />
              <input
                className="input-field w-14 text-sm text-center"
                placeholder="Init"
                type="number"
                value={initiative}
                onChange={(e) => setInitiative(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCombatant()}
              />
              <input
                className="input-field w-14 text-sm text-center"
                placeholder="HP"
                type="number"
                value={hp}
                onChange={(e) => setHp(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCombatant()}
              />
              <button onClick={addCombatant} className="btn-primary px-3 py-2 text-sm">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Combatant list */}
            {combatants.length === 0 ? (
              <p className="text-stone-600 text-sm italic text-center py-4">Add combatants to start tracking</p>
            ) : (
              <div className="flex flex-col gap-2">
                {combatants.map((c, i) => {
                  const isActive = i === currentTurn
                  const isDead = c.hp === 0 && c.maxHp > 0
                  const isDropTarget = dragOverIndex === i
                  return (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={() => handleDragStart(i)}
                      onDragOver={(e) => handleDragOver(e, i)}
                      onDrop={(e) => handleDrop(e, i)}
                      onDragEnd={handleDragEnd}
                      className={`rounded-xl border p-3 flex flex-col gap-2 transition-all cursor-grab active:cursor-grabbing ${
                        isActive ? 'border-amber-500 bg-amber-900/20' : 'border-amber-900/30 bg-dungeon-800'
                      } ${isDead ? 'opacity-40' : ''} ${isDropTarget ? 'ring-2 ring-amber-500/50 scale-[1.01]' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        {/* Drag handle */}
                        <GripVertical className="w-4 h-4 shrink-0 text-stone-600 hover:text-stone-400 transition-colors" />

                        {/* Turn indicator */}
                        <ChevronRight className={`w-4 h-4 shrink-0 transition-opacity ${isActive ? 'text-amber-400 opacity-100' : 'opacity-0'}`} />

                        {/* Initiative badge */}
                        <span className="text-xs font-bold text-amber-600 w-6 text-center shrink-0">{c.initiative}</span>

                        {/* Name */}
                        <p className={`font-medium text-sm flex-1 truncate ${isActive ? 'text-amber-200' : 'text-stone-300'}`}>
                          {c.name}
                        </p>

                        {/* HP */}
                        {c.maxHp > 0 && (
                          <div className="flex items-center gap-1 shrink-0 text-xs text-stone-500">
                            <input
                              type="number"
                              value={c.hp}
                              onChange={(e) => setCombatants((prev) =>
                                prev.map((x) => x.id === c.id ? { ...x, hp: Math.max(0, parseInt(e.target.value) || 0) } : x)
                              )}
                              className={`w-10 text-center bg-dungeon-700 border border-amber-900/40 rounded text-sm font-bold focus:outline-none focus:border-amber-600 ${isDead ? 'text-red-500' : 'text-stone-200'}`}
                            />
                            <span>/</span>
                            <span className="text-stone-400 font-medium">{c.maxHp}</span>
                          </div>
                        )}

                        {/* Remove */}
                        <button
                          onClick={() => removeCombatant(c.id)}
                          onMouseDown={(e) => e.stopPropagation()}
                          className="text-stone-600 hover:text-red-400 transition-colors ml-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Conditions */}
                      <div className="flex flex-wrap gap-1 pl-10">
                        {c.conditions.map((cond) => (
                          <button
                            key={cond}
                            onClick={() => toggleCondition(c.id, cond)}
                            className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                            style={{ background: CONDITION_COLORS[cond] + '30', color: CONDITION_COLORS[cond] }}
                          >
                            {cond}
                          </button>
                        ))}
                        <button
                          onClick={() => setConditionPicker(conditionPicker === c.id ? null : c.id)}
                          className="text-xs px-1.5 py-0.5 rounded-full bg-dungeon-700 text-stone-500 hover:text-stone-300 transition-colors"
                        >
                          + condition
                        </button>
                      </div>

                      {/* Condition picker */}
                      {conditionPicker === c.id && (
                        <div className="flex flex-wrap gap-1 pl-10">
                          {ALL_CONDITIONS.filter((cond) => !c.conditions.includes(cond)).map((cond) => (
                            <button
                              key={cond}
                              onClick={() => { toggleCondition(c.id, cond); setConditionPicker(null) }}
                              className="text-xs px-1.5 py-0.5 rounded-full border transition-colors hover:opacity-80"
                              style={{ borderColor: CONDITION_COLORS[cond] + '60', color: CONDITION_COLORS[cond] }}
                            >
                              {cond}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Next turn button */}
            {combatants.length > 0 && (
              <button onClick={nextTurn} className="btn-primary flex items-center justify-center gap-2">
                <SkipForward className="w-4 h-4" />
                Next Turn
                <span className="text-amber-200/60 text-xs">
                  → {combatants[(currentTurn + 1) % combatants.length]?.name}
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
