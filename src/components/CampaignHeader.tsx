import { useState } from 'react'
import { Sword, Shield, Clock } from 'lucide-react'
import { formatDistanceToNow, parseISO, isPast } from 'date-fns'
import { useCampaignStore } from '../store/useCampaignStore'
import { updateCampaign } from '../lib/firestore'

export function CampaignHeader() {
  const campaign = useCampaignStore((s) => s.campaign)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '' })

  if (!campaign) return null

  const nextSession = campaign.nextSessionDate ? parseISO(campaign.nextSessionDate) : null
  const countdown =
    nextSession && !isPast(nextSession)
      ? formatDistanceToNow(nextSession, { addSuffix: true })
      : null

  function startEdit() {
    setForm({ name: campaign!.name })
    setEditing(true)
  }

  async function save() {
    await updateCampaign(form)
    setEditing(false)
  }

  return (
    <header className="bg-dungeon-900 border-b-2 border-amber-700 px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Sword className="text-amber-500 w-8 h-8 shrink-0" />
          {editing ? (
            <div className="flex gap-2 items-center">
              <input
                className="bg-dungeon-800 border border-amber-700 text-amber-100 rounded px-2 py-1 text-lg font-display"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Campaign name"
              />
              <button onClick={save} className="text-amber-400 hover:text-amber-200 text-sm px-2 py-1 border border-amber-700 rounded">
                Save
              </button>
              <button onClick={() => setEditing(false)} className="text-stone-400 hover:text-stone-200 text-sm">
                Cancel
              </button>
            </div>
          ) : (
            <div>
              <h1
                className="text-2xl font-bold text-amber-400 cursor-pointer hover:text-amber-300"
                style={{ fontFamily: 'Cinzel Decorative, serif' }}
                onClick={startEdit}
              >
                {campaign.name}
              </h1>
            </div>
          )}
        </div>

        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2 text-stone-300">
            <Shield className="w-4 h-4 text-amber-600" />
            <span>Session <span className="text-amber-400 font-bold">#{campaign.sessionCount}</span></span>
          </div>
          {countdown && (
            <div className="flex items-center gap-2 text-stone-300">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Next session <span className="text-amber-400 font-bold">{countdown}</span></span>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
