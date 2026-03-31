import { useCampaignStore } from '../store/useCampaignStore'
import { X } from 'lucide-react'

const PLAYER_ID_KEY = 'dnd_player_id'

interface Props {
  onClose?: () => void
}

export function PlayerRoster({ onClose }: Props) {
  const { players, activePlayerId, setActivePlayer } = useCampaignStore()
  const myId = localStorage.getItem(PLAYER_ID_KEY)

  return (
    <aside className="w-64 shrink-0 bg-dungeon-900 border-r border-amber-900 p-4 flex flex-col gap-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-amber-500 font-bold uppercase tracking-widest text-xs">
          Adventurers
        </h2>
        {onClose && (
          <button onClick={onClose} className="text-stone-600 hover:text-stone-300 transition-colors md:hidden">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {players.map((p) => (
          <button
            key={p.id}
            onClick={() => { if (p.id === myId) { setActivePlayer(activePlayerId === p.id ? null : p.id); onClose?.() } }}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
              p.id !== myId ? 'cursor-default opacity-75' :
              activePlayerId === p.id
                ? 'bg-amber-900/40 ring-1 ring-amber-600'
                : 'hover:bg-dungeon-800'
            }`}
          >
            <span className="w-3 h-3 rounded-full shrink-0 ring-2 ring-black/30" style={{ background: p.color }} />
            <div className="min-w-0">
              <p className={`font-medium text-sm truncate ${p.id === myId ? 'text-amber-300' : 'text-amber-100'}`}>
                {p.characterName}
              </p>
              <p className="text-stone-500 text-xs truncate">{p.characterRace} {p.characterClass}</p>
              <p className="text-stone-600 text-xs truncate">{p.name}</p>
            </div>
          </button>
        ))}
        {players.length === 0 && (
          <p className="text-stone-600 text-xs italic">No adventurers yet...</p>
        )}
      </div>
    </aside>
  )
}
