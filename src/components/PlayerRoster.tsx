import { useCampaignStore } from '../store/useCampaignStore'
import { deletePlayer } from '../lib/firestore'
import { X, Trash2 } from 'lucide-react'

const PLAYER_ID_KEY = 'dnd_player_id'

interface Props {
  onClose?: () => void
}

export function PlayerRoster({ onClose }: Props) {
  const { players, activePlayerId, setActivePlayer } = useCampaignStore()
  const myId = localStorage.getItem(PLAYER_ID_KEY)

  async function handleDelete(playerId: string, characterName: string) {
    if (!confirm(`Remove ${characterName} from the party?`)) return
    await deletePlayer(playerId)
    if (playerId === myId) localStorage.removeItem(PLAYER_ID_KEY)
  }

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
          <div
            key={p.id}
            className={`group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
              p.id !== myId ? 'opacity-75' :
              activePlayerId === p.id
                ? 'bg-amber-900/40 ring-1 ring-amber-600'
                : 'hover:bg-dungeon-800'
            }`}
          >
            <button
              onClick={() => { if (p.id === myId) { setActivePlayer(activePlayerId === p.id ? null : p.id); onClose?.() } }}
              className="flex items-center gap-3 flex-1 min-w-0 text-left"
            >
              <span
                className="w-3 h-3 rounded-full shrink-0 ring-2 ring-black/30"
                style={{ background: p.color }}
              />
              <div className="min-w-0">
                <p className={`font-medium text-sm truncate ${p.id === myId ? 'text-amber-300' : 'text-amber-100'}`}>
                  {p.characterName}
                </p>
                <p className="text-stone-500 text-xs truncate">
                  {p.characterRace} {p.characterClass}
                </p>
                <p className="text-stone-600 text-xs truncate">{p.name}</p>
              </div>
            </button>
            <button
              onClick={() => handleDelete(p.id, p.characterName)}
              className="opacity-0 group-hover:opacity-100 text-stone-600 hover:text-red-400 transition-all shrink-0"
              title={`Remove ${p.characterName}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {players.length === 0 && (
          <p className="text-stone-600 text-xs italic">No adventurers yet...</p>
        )}
      </div>
    </aside>
  )
}
