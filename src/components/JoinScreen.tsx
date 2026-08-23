import { useState } from 'react'
import type { User } from 'firebase/auth'
import { Sword, ChevronDown, ChevronUp } from 'lucide-react'
import { upsertPlayer } from '../lib/firestore'
import { signInWithGoogle } from '../lib/firebase'

const PLAYER_ID_KEY = 'dnd_player_id'

const CLASS_OPTIONS = [
  'Barbarian','Bard','Cleric','Druid','Fighter','Monk',
  'Paladin','Ranger','Rogue','Sorcerer','Warlock','Wizard','Artificer',
]

const RACE_OPTIONS = [
  'Human','Elf','Dwarf','Halfling','Gnome','Half-Elf',
  'Half-Orc','Tiefling','Dragonborn','Aasimar','Tabaxi','Kenku','Other',
]

const COLOR_PRESETS = [
  '#FF8080','#CC1A00',
  '#FFBB66','#CC5200',
  '#FFE566','#997700',
  '#66DD88','#1A7A3A',
  '#66D9E8','#0A6E7A',
  '#66AAFF','#003DB3',
  '#9B99E8','#2E2B99',
  '#D499EE','#7A1FA0',
  '#FF99BB','#CC003D',
  '#FFAA80','#CC3300',
  '#FFFFFF',
]

interface Props {
  firebaseUser: User | null
  onJoined: (playerId: string) => void
}

export function JoinScreen({ firebaseUser, onJoined }: Props) {
  const [signingIn, setSigningIn] = useState(false)
  const [signInError, setSignInError] = useState('')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [form, setForm] = useState({
    characterName: '',
    characterClass: 'Fighter',
    characterRace: 'Human',
    color: COLOR_PRESETS[5], // default blue
  })
  const [loading, setLoading] = useState(false)

  async function handleGoogleSignIn() {
    setSigningIn(true)
    setSignInError('')
    try {
      await signInWithGoogle()
      // onAuthStateChanged in App.tsx will handle the rest
    } catch {
      setSignInError('Sign-in failed. Please try again.')
      setSigningIn(false)
    }
  }

  async function createCharacter() {
    if (!firebaseUser || !form.characterName.trim()) return
    setLoading(true)
    const id = await upsertPlayer({
      id: firebaseUser.uid,
      name: firebaseUser.displayName ?? '',
      ...form,
      availability: [],
      confirmedDates: [],
      declinedDates: [],
    })
    localStorage.setItem(PLAYER_ID_KEY, id)
    onJoined(id)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-dungeon-900 overflow-y-auto flex items-start justify-center p-4">
      <div className="bg-dungeon-800 border border-theme-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-5 my-auto">

        {/* Header */}
        <div className="text-center">
          <Sword className="w-12 h-12 text-theme-500 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-theme-400" style={{ fontFamily: 'Cinzel Decorative, serif' }}>
            DnD Planner
          </h1>
          <p className="text-prose-500 text-sm mt-1">
            {firebaseUser ? 'Create your character' : 'Sign in to join the campaign'}
          </p>
        </div>

        {/* Step 1: Not signed in → Google button */}
        {!firebaseUser && (
          <>
            <button
              onClick={handleGoogleSignIn}
              disabled={signingIn}
              className="flex items-center justify-center gap-3 w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl px-4 py-3 transition-colors shadow-sm disabled:opacity-60"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {signingIn ? 'Signing in...' : 'Sign in with Google'}
            </button>
            {signInError && <p className="text-red-400 text-xs text-center">{signInError}</p>}
          </>
        )}

        {/* Step 2: Signed in but no character → create one */}
        {firebaseUser && (
          <>
            {/* Show who's signed in */}
            <div className="flex items-center gap-3 bg-dungeon-900/50 rounded-xl px-3 py-2.5">
              {firebaseUser.photoURL && (
                <img src={firebaseUser.photoURL} className="w-8 h-8 rounded-full" alt="" />
              )}
              <div className="min-w-0">
                <p className="text-prose-200 text-sm font-medium truncate">{firebaseUser.displayName}</p>
                <p className="text-prose-500 text-xs truncate">{firebaseUser.email}</p>
              </div>
            </div>

            <input
              className="input-field"
              placeholder="Character name"
              value={form.characterName}
              onChange={(e) => setForm((f) => ({ ...f, characterName: e.target.value }))}
              autoFocus
            />
            <select
              className="input-field"
              value={form.characterClass}
              onChange={(e) => setForm((f) => ({ ...f, characterClass: e.target.value }))}
            >
              {CLASS_OPTIONS.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select
              className="input-field"
              value={form.characterRace}
              onChange={(e) => setForm((f) => ({ ...f, characterRace: e.target.value }))}
            >
              {RACE_OPTIONS.map((r) => <option key={r}>{r}</option>)}
            </select>

            {/* Color picker toggle */}
            <div>
              <button
                onClick={() => setShowColorPicker((v) => !v)}
                className="flex items-center gap-2 text-prose-500 text-xs hover:text-prose-300 transition-colors"
              >
                <span className="w-4 h-4 rounded-full border border-prose-600" style={{ background: form.color }} />
                Pick your colour
                {showColorPicker ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {showColorPicker && (
                <div className="flex gap-2 flex-wrap mt-2">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setForm((f) => ({ ...f, color: c }))}
                      className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                      style={{
                        background: c,
                        outline: form.color === c ? `2px solid ${c === '#FFFFFF' ? '#888' : 'white'}` : 'none',
                        outlineOffset: '2px',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={createCharacter}
              disabled={!form.characterName.trim() || loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Enter the Campaign'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
