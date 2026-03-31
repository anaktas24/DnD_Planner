import { useState } from 'react'
import { Shield, UserX, RefreshCw, Pin, MapPin, Crown, ChevronDown } from 'lucide-react'
import { useCampaignStore } from '../store/useCampaignStore'
import { setRole, claimAdmin, kickPlayer, resetPlayerAvailability, updateCampaign } from '../lib/firestore'
import type { Role } from '../types'

const PLAYER_ID_KEY = 'dnd_player_id'

export function AdminPanel() {
  const { campaign, players } = useCampaignStore()
  const myId = localStorage.getItem(PLAYER_ID_KEY)
  const myRole: Role = myId ? (campaign?.roles?.[myId] ?? 'player') : 'player'
  const isAdmin = myRole === 'admin'
  const roles = campaign?.roles ?? {}

  const [announcement, setAnnouncement] = useState(campaign?.pinnedAnnouncement ?? '')
  const [location, setLocation] = useState(campaign?.sessionLocation ?? '')
  const [claiming, setClaiming] = useState(false)
  const [claimError, setClaimError] = useState('')

  async function handleClaimAdmin() {
    if (!myId) return
    setClaiming(true)
    const success = await claimAdmin(myId)
    if (!success) setClaimError('An admin already exists.')
    setClaiming(false)
  }

  async function handleRoleChange(playerId: string, role: Role) {
    await setRole(playerId, role)
  }

  async function handleKick(playerId: string, name: string) {
    if (!confirm(`Kick ${name} from the campaign?`)) return
    await kickPlayer(playerId)
  }

  async function handleResetAvailability(playerId: string, name: string) {
    if (!confirm(`Reset ${name}'s availability?`)) return
    await resetPlayerAvailability(playerId)
  }

  async function saveAnnouncement() {
    await updateCampaign({ pinnedAnnouncement: announcement.trim() || null })
  }

  async function saveLocation() {
    await updateCampaign({ sessionLocation: location.trim() || null })
  }

  const hasAdmin = Object.values(roles).includes('admin')

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
      <div className="max-w-2xl w-full mx-auto px-4 py-6 flex flex-col gap-6">

        <div>
          <h2 className="text-2xl font-bold text-amber-400 mb-1" style={{ fontFamily: 'Cinzel, serif' }}>
            Admin Panel
          </h2>
          <p className="text-stone-500 text-sm">Campaign management</p>
        </div>

        {/* Claim admin */}
        {!hasAdmin && (
          <div className="bg-amber-900/20 border border-amber-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-amber-500" />
              <p className="text-amber-400 font-semibold text-sm">No admin yet</p>
            </div>
            <p className="text-stone-500 text-xs mb-3">Be the first to claim admin for this campaign.</p>
            {claimError && <p className="text-red-400 text-xs mb-2">{claimError}</p>}
            <button onClick={handleClaimAdmin} disabled={claiming} className="btn-primary text-sm">
              {claiming ? 'Claiming...' : 'Claim Admin'}
            </button>
          </div>
        )}

        {isAdmin ? (
          <>
            {/* Pinned announcement */}
            <section className="bg-dungeon-800 border border-amber-900/30 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Pin className="w-4 h-4 text-amber-500" />
                <h3 className="text-amber-400 font-semibold text-sm">Pinned Announcement</h3>
              </div>
              <textarea
                className="input-field resize-none"
                rows={2}
                placeholder="Pin a message for all players..."
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
              />
              <div className="flex gap-2">
                <button onClick={saveAnnouncement} className="btn-primary text-xs px-3 py-1.5">Save</button>
                {announcement && (
                  <button onClick={() => { setAnnouncement(''); updateCampaign({ pinnedAnnouncement: null }) }}
                    className="text-stone-500 hover:text-stone-300 text-xs px-3 py-1.5">
                    Clear
                  </button>
                )}
              </div>
            </section>

            {/* Session location */}
            <section className="bg-dungeon-800 border border-amber-900/30 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-500" />
                <h3 className="text-amber-400 font-semibold text-sm">Session Location</h3>
              </div>
              <input
                className="input-field"
                placeholder="Where are we playing? (e.g. John's place, Discord)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <button onClick={saveLocation} className="btn-primary text-xs px-3 py-1.5 self-start">Save</button>
            </section>

            {/* Player management */}
            <section className="bg-dungeon-800 border border-amber-900/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-amber-500" />
                <h3 className="text-amber-400 font-semibold text-sm">Players</h3>
              </div>
              <div className="flex flex-col gap-3">
                {players.map((p) => {
                  const role: Role = roles[p.id] ?? 'player'
                  const isMe = p.id === myId
                  return (
                    <div key={p.id} className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
                      <div className="min-w-0 flex-1">
                        <p className="text-stone-200 text-sm font-medium truncate">{p.characterName}</p>
                        <p className="text-stone-600 text-xs truncate">{p.name}</p>
                      </div>

                      {/* Role selector */}
                      {!isMe && (
                        <div className="relative">
                          <select
                            value={role}
                            onChange={(e) => handleRoleChange(p.id, e.target.value as Role)}
                            className="input-field py-1 pr-6 text-xs appearance-none cursor-pointer"
                            style={{ width: 'auto' }}
                          >
                            <option value="player">Player</option>
                            <option value="editor">Editor</option>
                            <option value="admin">Admin</option>
                          </select>
                          <ChevronDown className="w-3 h-3 text-stone-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      )}
                      {isMe && (
                        <span className="text-xs text-amber-600 font-semibold px-2">Admin (you)</span>
                      )}

                      {/* Reset availability */}
                      {!isMe && (
                        <button
                          onClick={() => handleResetAvailability(p.id, p.characterName)}
                          className="p-1.5 text-stone-600 hover:text-amber-400 transition-colors"
                          title="Reset availability"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}

                      {/* Kick */}
                      {!isMe && (
                        <button
                          onClick={() => handleKick(p.id, p.characterName)}
                          className="p-1.5 text-stone-600 hover:text-red-400 transition-colors"
                          title="Kick player"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          </>
        ) : hasAdmin ? (
          <div className="text-center py-12">
            <Shield className="w-10 h-10 text-stone-700 mx-auto mb-3" />
            <p className="text-stone-500 text-sm">You don't have admin access.</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
