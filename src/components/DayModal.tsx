import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { X, Check, XCircle, MinusCircle, BookOpen } from 'lucide-react'
import { useCampaignStore } from '../store/useCampaignStore'
import { upsertNote } from '../lib/firestore'
import type { SessionNote } from '../types'

interface Props {
  date: string
  onClose: () => void
  onVote: (playerId: string, vote: 'confirm' | 'decline' | 'clear') => void
}

export function DayModal({ date, onClose, onVote }: Props) {
  const { players, notes, campaign } = useCampaignStore()
  const existingNote = notes.find((n) => n.date === date)
  const [noteForm, setNoteForm] = useState<Partial<SessionNote>>(existingNote ?? {
    date,
    sessionNumber: (campaign?.sessionCount ?? 0) + 1,
    summary: '',
    location: '',
    nextLocation: '',
  })
  const [showNoteForm, setShowNoteForm] = useState(false)

  async function saveNote() {
    await upsertNote({
      ...noteForm,
      id: existingNote?.id,
      date,
      sessionNumber: noteForm.sessionNumber ?? 1,
      summary: noteForm.summary ?? '',
      location: noteForm.location ?? '',
      nextLocation: noteForm.nextLocation ?? '',
    })
    setShowNoteForm(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="bg-dungeon-900 border border-amber-800 rounded-xl w-full max-w-md mx-4 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-amber-400 font-bold" style={{ fontFamily: 'Cinzel, serif' }}>
            {format(parseISO(date), 'EEEE, MMMM d yyyy')}
          </h3>
          <button onClick={onClose}><X className="w-5 h-5 text-stone-500 hover:text-stone-300" /></button>
        </div>

        {/* Vote section */}
        <div className="mb-4">
          <p className="text-stone-500 text-xs uppercase tracking-wider mb-2">Player Votes</p>
          <div className="flex flex-col gap-1.5">
            {players.map((p) => {
              const confirmed = p.confirmedDates?.includes(date)
              const declined = p.declinedDates?.includes(date)
              return (
                <div key={p.id} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-stone-300">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                    {p.characterName || p.name}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => onVote(p.id, confirmed ? 'clear' : 'confirm')}
                      className={`p-1 rounded transition-colors ${confirmed ? 'text-emerald-400 bg-emerald-900/40' : 'text-stone-600 hover:text-emerald-500'}`}
                      title="Confirm"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onVote(p.id, declined ? 'clear' : 'decline')}
                      className={`p-1 rounded transition-colors ${declined ? 'text-red-400 bg-red-900/40' : 'text-stone-600 hover:text-red-500'}`}
                      title="Can't make it"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                    {(confirmed || declined) && (
                      <button
                        onClick={() => onVote(p.id, 'clear')}
                        className="p-1 rounded text-stone-600 hover:text-stone-400 transition-colors"
                        title="Clear vote"
                      >
                        <MinusCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Session note */}
        {existingNote && !showNoteForm ? (
          <div className="bg-dungeon-800 rounded-lg p-3 text-sm border border-amber-900/40">
            <div className="flex justify-between items-center mb-1">
              <span className="text-amber-600 font-semibold text-xs uppercase tracking-wider">
                Session #{existingNote.sessionNumber}
              </span>
              <button onClick={() => setShowNoteForm(true)} className="text-stone-500 hover:text-stone-300 text-xs">
                Edit
              </button>
            </div>
            {existingNote.summary && <p className="text-stone-300 mb-1">{existingNote.summary}</p>}
            {existingNote.location && <p className="text-stone-500 text-xs">Location: {existingNote.location}</p>}
            {existingNote.nextLocation && <p className="text-stone-500 text-xs">Next: {existingNote.nextLocation}</p>}
          </div>
        ) : showNoteForm ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span className="text-amber-600 text-xs font-bold uppercase tracking-wider">Session Note</span>
            </div>
            <input
              type="number"
              className="input-field"
              placeholder="Session #"
              value={noteForm.sessionNumber ?? ''}
              onChange={(e) => setNoteForm((f) => ({ ...f, sessionNumber: Number(e.target.value) }))}
            />
            <textarea
              className="input-field resize-none"
              rows={3}
              placeholder="What happened this session..."
              value={noteForm.summary ?? ''}
              onChange={(e) => setNoteForm((f) => ({ ...f, summary: e.target.value }))}
            />
            <input
              className="input-field"
              placeholder="Session location"
              value={noteForm.location ?? ''}
              onChange={(e) => setNoteForm((f) => ({ ...f, location: e.target.value }))}
            />
            <input
              className="input-field"
              placeholder="Next session location"
              value={noteForm.nextLocation ?? ''}
              onChange={(e) => setNoteForm((f) => ({ ...f, nextLocation: e.target.value }))}
            />
            <div className="flex gap-2">
              <button onClick={saveNote} className="btn-primary flex-1 text-sm">Save</button>
              <button onClick={() => setShowNoteForm(false)} className="text-stone-500 hover:text-stone-300 text-sm px-3">Cancel</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowNoteForm(true)}
            className="flex items-center gap-2 text-amber-700 hover:text-amber-500 text-sm transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Add session note
          </button>
        )}
      </div>
    </div>
  )
}
