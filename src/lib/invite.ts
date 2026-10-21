import { doc, getDoc } from 'firebase/firestore'
import { db } from './firebase'

const STORAGE_KEY = 'inviteToken'

export function getInviteToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function setInviteToken(token: string) {
  try {
    localStorage.setItem(STORAGE_KEY, token)
  } catch {
    // storage blocked — token only lives for this page load
  }
}

// Pick up ?invite=<token> from the URL, store it and strip it from the address bar
export function captureInviteFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search)
  const token = params.get('invite')?.trim()
  if (!token) return getInviteToken()
  setInviteToken(token)
  params.delete('invite')
  const qs = params.toString()
  window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash)
  return token
}

// An invite is valid if a doc with that id exists in /invites (readable by id only, never listable)
export async function isInviteValid(token: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, 'invites', token))
    return snap.exists()
  } catch {
    return false
  }
}
