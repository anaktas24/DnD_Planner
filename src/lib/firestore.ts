import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
  Unsubscribe,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Player, Campaign, SessionNote } from '../types'

const CAMPAIGN_ID = 'main' // single-campaign app for now

// ── Campaign ──────────────────────────────────────────────────────────────────

// cb receives null when doc doesn't exist yet (not-setup state)
export function subscribeCampaign(cb: (c: Campaign | null) => void): Unsubscribe {
  return onSnapshot(doc(db, 'campaigns', CAMPAIGN_ID), (snap) => {
    cb(snap.exists() ? (snap.data() as Campaign) : ({ name: '' } as Campaign))
  })
}

export async function updateCampaign(data: Partial<Campaign>): Promise<void> {
  await setDoc(doc(db, 'campaigns', CAMPAIGN_ID), data, { merge: true })
}

// ── Players ───────────────────────────────────────────────────────────────────

export function subscribePlayers(cb: (players: Player[]) => void): Unsubscribe {
  return onSnapshot(collection(db, 'campaigns', CAMPAIGN_ID, 'players'), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Player)))
  })
}

export async function upsertPlayer(player: Omit<Player, 'id'> & { id?: string }): Promise<string> {
  const id = player.id ?? crypto.randomUUID()
  await setDoc(doc(db, 'campaigns', CAMPAIGN_ID, 'players', id), { ...player, id }, { merge: true })
  return id
}

export async function toggleAvailability(playerId: string, date: string): Promise<void> {
  const ref = doc(db, 'campaigns', CAMPAIGN_ID, 'players', playerId)
  const snap = await getDoc(ref)
  const availability: string[] = snap.data()?.availability ?? []
  if (availability.includes(date)) {
    await updateDoc(ref, { availability: arrayRemove(date) })
  } else {
    await updateDoc(ref, { availability: arrayUnion(date) })
  }
}

export async function setVote(
  playerId: string,
  date: string,
  vote: 'confirm' | 'decline' | 'clear'
): Promise<void> {
  const ref = doc(db, 'campaigns', CAMPAIGN_ID, 'players', playerId)
  if (vote === 'confirm') {
    await updateDoc(ref, {
      confirmedDates: arrayUnion(date),
      declinedDates: arrayRemove(date),
    })
  } else if (vote === 'decline') {
    await updateDoc(ref, {
      declinedDates: arrayUnion(date),
      confirmedDates: arrayRemove(date),
    })
  } else {
    await updateDoc(ref, {
      confirmedDates: arrayRemove(date),
      declinedDates: arrayRemove(date),
    })
  }
}

// ── Bulk operations ───────────────────────────────────────────────────────────

export async function clearAllAvailability(): Promise<void> {
  const snap = await import('firebase/firestore').then(({ getDocs, collection: col }) =>
    getDocs(col(db, 'campaigns', CAMPAIGN_ID, 'players'))
  )
  const { writeBatch, doc: d } = await import('firebase/firestore')
  const batch = writeBatch(db)
  snap.docs.forEach((docSnap) => {
    batch.update(d(db, 'campaigns', CAMPAIGN_ID, 'players', docSnap.id), {
      availability: [],
      confirmedDates: [],
      declinedDates: [],
    })
  })
  await batch.commit()
}

// ── Date Poll ─────────────────────────────────────────────────────────────────

export async function voteForDate(playerId: string, date: string, allDates: string[]): Promise<void> {
  const ref = doc(db, 'campaigns', CAMPAIGN_ID)
  const snap = await getDoc(ref)
  const current: Record<string, string[]> = snap.data()?.dateVotes ?? {}

  // Remove this player's vote from all other dates
  const updated: Record<string, string[]> = {}
  for (const d of allDates) {
    updated[d] = (current[d] ?? []).filter((id) => id !== playerId)
  }
  // Add vote to chosen date
  if (!updated[date].includes(playerId)) updated[date].push(playerId)

  await updateDoc(ref, { dateVotes: updated })
}

export async function clearDateVotes(): Promise<void> {
  await updateDoc(doc(db, 'campaigns', CAMPAIGN_ID), { dateVotes: {} })
}

// ── Session Notes ─────────────────────────────────────────────────────────────

export function subscribeNotes(cb: (notes: SessionNote[]) => void): Unsubscribe {
  return onSnapshot(collection(db, 'campaigns', CAMPAIGN_ID, 'notes'), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as SessionNote)))
  })
}

export async function upsertNote(note: Omit<SessionNote, 'id'> & { id?: string }): Promise<void> {
  const id = note.id ?? crypto.randomUUID()
  await setDoc(doc(db, 'campaigns', CAMPAIGN_ID, 'notes', id), { ...note, id }, { merge: true })
}
