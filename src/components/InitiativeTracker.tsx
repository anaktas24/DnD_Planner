import { useState, useRef, useEffect } from 'react'
import { Sword, X, ChevronRight, Plus, SkipForward, Trash2, GripVertical, ArrowLeft } from 'lucide-react'
import { useCampaignStore } from '../store/useCampaignStore'
import { useInitiativeStore } from '../store/useInitiativeStore'
import { ConfirmDialog } from './ConfirmDialog'

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

interface ButtonProps {
  onNavigate: () => void
}

export function InitiativeTrackerButton({ onNavigate }: ButtonProps) {
  const combatantCount = useInitiativeStore((s) => s.combatants.length)
  return (
    <button
      onClick={onNavigate}
      className="relative p-2 rounded-lg text-stone-500 hover:text-amber-400 transition-colors"
      title="Initiative Tracker"
      aria-label="Initiative Tracker"
    >
      <Sword className="w-5 h-5" />
      {combatantCount > 0 && (
        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
      )}
    </button>
  )
}

interface Props {
  onBack: () => void
}

export function InitiativeTracker({ onBack }: Props) {
  const campaign = useCampaignStore((s) => s.campaign)
  const myId = useCampaignStore((s) => s.activePlayerId)
  const isAdmin = myId ? (campaign?.roles?.[myId] ?? 'player') === 'admin' : false

  const combatants = useInitiativeStore((s) => s.combatants)
  const currentTurn = useInitiativeStore((s) => s.currentTurn)
  const round = useInitiativeStore((s) => s.round)
  const addCombatant = useInitiativeStore((s) => s.addCombatant)
  const removeCombatant = useInitiativeStore((s) => s.removeCombatant)
  const updateHp = useInitiativeStore((s) => s.updateHp)
  const toggleCondition = useInitiativeStore((s) => s.toggleCondition)
  const reorder = useInitiativeStore((s) => s.reorder)
  const nextTurn = useInitiativeStore((s) => s.nextTurn)
  const clearAll = useInitiativeStore((s) => s.clearAll)

  const [name, setName] = useState('')
  const [initiative, setInitiative] = useState('')
  const [hp, setHp] = useState('')
  const [conditionPicker, setConditionPicker] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const dragIndexRef = useRef<number | null>(null)

  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16">
        <Sword className="w-10 h-10 text-stone-700" />
        <p className="text-stone-500 text-sm">You don't have access to the Initiative Tracker.</p>
        <button onClick={onBack} className="text-amber-500 hover:text-amber-400 text-sm">Back to Home</button>
      </div>
    )
  }

  function handleAdd() {
    if (!name.trim()) return
    addCombatant({
      name: name.trim(),
      initiative: parseInt(initiative) || 0,
      hp: parseInt(hp) || 0,
      maxHp: parseInt(hp) || 0,
      conditions: [],
    })
    setName('')
    setInitiative('')
    setHp('')
    nameRef.current?.focus()
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
    if (fromIndex !== null) reorder(fromIndex, toIndex)
    dragIndexRef.current = null
    setDragOverIndex(null)
  }

  function handleDragEnd() {
    dragIndexRef.current = null
    setDragOverIndex(null)
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
      <div className="max-w-2xl w-full mx-auto px-4 py-6 flex flex-col gap-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-1.5 text-stone-500 hover:text-amber-400 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-3">
            <Sword className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-bold text-amber-400" style={{ fontFamily: 'Cinzel, serif' }}>Initiative Tracker</h2>
            <span className="text-stone-500 text-sm">Round <span className="text-amber-400 font-bold">{round}</span></span>
          </div>
          {combatants.length > 0 ? (
            <button onClick={() => setConfirmClearOpen(true)} className="p-1.5 text-stone-600 hover:text-red-400 transition-colors" title="End combat" aria-label="End combat">
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <span className="w-6" />
          )}
        </div>

        {/* Quick add */}
        <div className="bg-dungeon-800 border border-amber-900/30 rounded-xl p-3 flex flex-col gap-2">
          <input
            ref={nameRef}
            className="input-field text-sm"
            placeholder="Combatant name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <div className="flex gap-2">
            <input
              className="no-spinner input-field flex-1 text-sm text-center"
              placeholder="Initiative"
              type="number"
              inputMode="numeric"
              value={initiative}
              onChange={(e) => setInitiative(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <input
              className="no-spinner input-field flex-1 text-sm text-center"
              placeholder="HP"
              type="number"
              inputMode="numeric"
              value={hp}
              onChange={(e) => setHp(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <button onClick={handleAdd} className="btn-primary px-4 flex items-center justify-center shrink-0">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Combatant list */}
        {combatants.length === 0 ? (
          <p className="text-stone-600 text-sm italic text-center py-8">Add combatants to start tracking</p>
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
                    <GripVertical aria-hidden="true" className="w-4 h-4 shrink-0 text-stone-600 hover:text-stone-400 transition-colors" />
                    <ChevronRight className={`w-4 h-4 shrink-0 transition-opacity ${isActive ? 'text-amber-400 opacity-100' : 'opacity-0'}`} />
                    <span className="text-xs font-bold text-amber-600 w-6 text-center shrink-0">{c.initiative}</span>
                    <p className={`font-medium text-sm flex-1 truncate ${isActive ? 'text-amber-200' : 'text-stone-300'}`}>
                      {c.name}
                    </p>
                    {c.maxHp > 0 && (
                      <div className="flex items-center gap-1 shrink-0 text-xs text-stone-500">
                        <input
                          type="number"
                          inputMode="numeric"
                          value={c.hp}
                          onChange={(e) => updateHp(c.id, parseInt(e.target.value) || 0)}
                          aria-label={`${c.name}'s HP`}
                          className={`no-spinner w-12 h-8 text-center bg-white border border-amber-900/40 rounded text-sm font-bold focus:outline-none focus:border-amber-600 ${isDead ? 'text-red-600' : 'text-stone-900'}`}
                        />
                        <span>/</span>
                        <span className="text-stone-400 font-medium">{c.maxHp}</span>
                      </div>
                    )}
                    <button
                      onClick={() => removeCombatant(c.id)}
                      onMouseDown={(e) => e.stopPropagation()}
                      aria-label={`Remove ${c.name}`}
                      className="text-stone-600 hover:text-red-400 transition-colors ml-1 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

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

      <ConfirmDialog
        open={confirmClearOpen}
        title="End Combat"
        message="End combat and clear all combatants?"
        confirmLabel="End Combat"
        danger
        onConfirm={() => { clearAll(); setConfirmClearOpen(false) }}
        onCancel={() => setConfirmClearOpen(false)}
      />
    </div>
  )
}
