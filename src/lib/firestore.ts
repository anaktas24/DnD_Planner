import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
  deleteDoc,
  getDocs,
  writeBatch,
  orderBy,
  query,
  runTransaction,
  Unsubscribe,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Player, Campaign, SessionNote, BlogPost, Role } from '../types'

const CAMPAIGN_ID = 'main'

// ── Campaign ──────────────────────────────────────────────────────────────────

export function subscribeCampaign(cb: (c: Campaign | null) => void): Unsubscribe {
  return onSnapshot(doc(db, 'campaigns', CAMPAIGN_ID), (snap) => {
    cb(snap.exists() ? (snap.data() as Campaign) : ({ name: '' } as Campaign))
  })
}

export async function updateCampaign(data: Partial<Campaign>): Promise<void> {
  await setDoc(doc(db, 'campaigns', CAMPAIGN_ID), data, { merge: true })
}

// ── Roles ─────────────────────────────────────────────────────────────────────

export async function setRole(playerId: string, role: Role): Promise<void> {
  await updateDoc(doc(db, 'campaigns', CAMPAIGN_ID), {
    [`roles.${playerId}`]: role,
  })
}

export async function claimAdmin(playerId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'campaigns', CAMPAIGN_ID))
  const roles: Record<string, Role> = snap.data()?.roles ?? {}
  const hasAdmin = Object.values(roles).includes('admin')
  if (hasAdmin) return false
  await updateDoc(doc(db, 'campaigns', CAMPAIGN_ID), {
    [`roles.${playerId}`]: 'admin',
  })
  return true
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

export async function kickPlayer(playerId: string): Promise<void> {
  await deleteDoc(doc(db, 'campaigns', CAMPAIGN_ID, 'players', playerId))
  // Remove their role too
  const snap = await getDoc(doc(db, 'campaigns', CAMPAIGN_ID))
  const roles: Record<string, Role> = snap.data()?.roles ?? {}
  delete roles[playerId]
  await updateDoc(doc(db, 'campaigns', CAMPAIGN_ID), { roles })
}

export async function resetPlayerAvailability(playerId: string): Promise<void> {
  await updateDoc(doc(db, 'campaigns', CAMPAIGN_ID, 'players', playerId), {
    availability: [],
    confirmedDates: [],
    declinedDates: [],
  })
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
    await updateDoc(ref, { confirmedDates: arrayUnion(date), declinedDates: arrayRemove(date) })
  } else if (vote === 'decline') {
    await updateDoc(ref, { declinedDates: arrayUnion(date), confirmedDates: arrayRemove(date) })
  } else {
    await updateDoc(ref, { confirmedDates: arrayRemove(date), declinedDates: arrayRemove(date) })
  }
}

// ── Bulk operations ───────────────────────────────────────────────────────────

export async function clearAllAvailability(): Promise<void> {
  const snap = await getDocs(collection(db, 'campaigns', CAMPAIGN_ID, 'players'))
  const batch = writeBatch(db)
  snap.docs.forEach((docSnap) => {
    batch.update(doc(db, 'campaigns', CAMPAIGN_ID, 'players', docSnap.id), {
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

  const updated: Record<string, string[]> = {}
  for (const d of allDates) {
    updated[d] = (current[d] ?? []).filter((id) => id !== playerId)
  }
  const alreadyVotedHere = (current[date] ?? []).includes(playerId)
  if (!alreadyVotedHere) updated[date].push(playerId)

  await updateDoc(ref, { dateVotes: updated })
}

export async function clearDateVotes(): Promise<void> {
  await updateDoc(doc(db, 'campaigns', CAMPAIGN_ID), { dateVotes: {} })
}

export async function voteForTimeSlot(playerId: string, slot: string): Promise<void> {
  const ref = doc(db, 'campaigns', CAMPAIGN_ID)
  const snap = await getDoc(ref)
  const current: Record<string, string[]> = snap.data()?.timeVotes ?? {}

  const alreadyVotedHere = (current[slot] ?? []).includes(playerId)
  const updated = alreadyVotedHere
    ? (current[slot] ?? []).filter((id) => id !== playerId)
    : [...(current[slot] ?? []), playerId]

  await updateDoc(ref, { [`timeVotes.${slot}`]: updated })
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

// ── Notifications ─────────────────────────────────────────────────────────────

export function subscribeNotifications(cb: (n: import('../types').Notification[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'campaigns', CAMPAIGN_ID, 'notifications'), orderBy('createdAt', 'desc')),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as import('../types').Notification)))
  )
}

export async function sendNotification(message: string): Promise<void> {
  const id = crypto.randomUUID()
  await setDoc(doc(db, 'campaigns', CAMPAIGN_ID, 'notifications', id), {
    id,
    message,
    createdAt: new Date().toISOString(),
    readBy: [],
  })
}

export async function markNotificationRead(notificationId: string, playerId: string): Promise<void> {
  await updateDoc(doc(db, 'campaigns', CAMPAIGN_ID, 'notifications', notificationId), {
    readBy: arrayUnion(playerId),
  })
}

// ── Blog ──────────────────────────────────────────────────────────────────────

export function subscribeBlog(cb: (posts: BlogPost[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'campaigns', CAMPAIGN_ID, 'blog'), orderBy('createdAt', 'desc')),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as BlogPost)))
  )
}

export async function upsertBlogPost(post: Omit<BlogPost, 'id'> & { id?: string }): Promise<string> {
  const id = post.id ?? crypto.randomUUID()
  await setDoc(doc(db, 'campaigns', CAMPAIGN_ID, 'blog', id), { ...post, id }, { merge: true })
  return id
}

export async function deleteBlogPost(postId: string): Promise<void> {
  await deleteDoc(doc(db, 'campaigns', CAMPAIGN_ID, 'blog', postId))
}

// ── Discord Webhook ───────────────────────────────────────────────────────────

// Uses a Firestore transaction to ensure only one client sends the webhook
// even if multiple players have the app open at the same time.
export async function claimWebhookSend(field: 'discordDateNotified' | 'discordTimeNotified'): Promise<boolean> {
  const ref = doc(db, 'campaigns', CAMPAIGN_ID)
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref)
      if (snap.data()?.[field] === true) throw new Error('already sent')
      tx.update(ref, { [field]: true })
    })
    return true
  } catch {
    return false
  }
}
