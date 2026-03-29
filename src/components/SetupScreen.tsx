import { useState } from 'react'
import { Sword } from 'lucide-react'
import { updateCampaign } from '../lib/firestore'

export function SetupScreen() {
  const [name, setName] = useState('')
  const [dmName, setDmName] = useState('')
  const [loading, setLoading] = useState(false)

  async function create() {
    if (!name.trim()) return
    setLoading(true)
    await updateCampaign({
      id: 'main',
      name,
      dmName,
      sessionCount: 0,
      nextSessionDate: null,
      createdAt: new Date().toISOString(),
    })
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
          <p className="text-stone-500 text-sm mt-1">Begin your campaign</p>
        </div>

        <input
          className="input-field"
          placeholder="Campaign name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="input-field"
          placeholder="Dungeon Master name"
          value={dmName}
          onChange={(e) => setDmName(e.target.value)}
        />
        <button
          onClick={create}
          disabled={!name.trim() || loading}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating...' : 'Create Campaign'}
        </button>
      </div>
    </div>
  )
}
