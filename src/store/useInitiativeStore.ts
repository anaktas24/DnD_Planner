import { create } from 'zustand'

export interface Combatant {
  id: string
  name: string
  initiative: number
  hp: number
  maxHp: number
  conditions: string[]
}

function uniqueName(base: string, existingNames: string[]): string {
  if (!existingNames.includes(base)) return base
  let n = 2
  while (existingNames.includes(`${base} ${n}`)) n++
  return `${base} ${n}`
}

interface InitiativeStore {
  combatants: Combatant[]
  currentTurn: number
  round: number

  addCombatant: (c: Omit<Combatant, 'id'>) => void
  removeCombatant: (id: string) => void
  updateHp: (id: string, hp: number) => void
  toggleCondition: (id: string, condition: string) => void
  reorder: (fromIndex: number, toIndex: number) => void
  nextTurn: () => void
  clearAll: () => void
}

export const useInitiativeStore = create<InitiativeStore>((set, get) => ({
  combatants: [],
  currentTurn: 0,
  round: 1,

  addCombatant: (c) => {
    set((state) => {
      const newC: Combatant = { id: crypto.randomUUID(), ...c, name: uniqueName(c.name, state.combatants.map((x) => x.name)) }
      const insertAt = state.combatants.findIndex((x) => x.initiative < newC.initiative)
      const next = [...state.combatants]
      if (insertAt === -1) next.push(newC)
      else next.splice(insertAt, 0, newC)
      return { combatants: next }
    })
  },

  removeCombatant: (id) => set((state) => ({
    combatants: state.combatants.filter((c) => c.id !== id),
    currentTurn: 0,
  })),

  updateHp: (id, hp) => set((state) => ({
    combatants: state.combatants.map((c) => (c.id === id ? { ...c, hp: Math.max(0, hp) } : c)),
  })),

  toggleCondition: (id, condition) => set((state) => ({
    combatants: state.combatants.map((c) =>
      c.id === id
        ? { ...c, conditions: c.conditions.includes(condition) ? c.conditions.filter((x) => x !== condition) : [...c.conditions, condition] }
        : c
    ),
  })),

  reorder: (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return
    const { combatants, currentTurn } = get()
    const activeId = combatants[currentTurn]?.id
    const next = [...combatants]
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)
    const newTurn = activeId ? next.findIndex((c) => c.id === activeId) : 0
    set({ combatants: next, currentTurn: newTurn >= 0 ? newTurn : 0 })
  },

  nextTurn: () => set((state) => {
    const next = state.currentTurn + 1
    return next >= state.combatants.length
      ? { currentTurn: 0, round: state.round + 1 }
      : { currentTurn: next }
  }),

  clearAll: () => set({ combatants: [], currentTurn: 0, round: 1 }),
}))
