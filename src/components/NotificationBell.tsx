import { useState, useRef, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { useCampaignStore } from '../store/useCampaignStore'
import { markNotificationRead } from '../lib/firestore'

const PLAYER_ID_KEY = 'dnd_player_id'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { notifications } = useCampaignStore()
  const myId = localStorage.getItem(PLAYER_ID_KEY) ?? ''

  const unread = notifications.filter((n) => !n.readBy.includes(myId))

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function openPanel() {
    setOpen((o) => !o)
    if (unread.length > 0 && myId) {
      await Promise.all(unread.map((n) => markNotificationRead(n.id, myId).catch(() => {})))
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={openPanel}
        className={`relative p-2 rounded-lg transition-colors ${open ? 'bg-amber-900/40 text-amber-400' : 'text-stone-500 hover:text-amber-400'}`}
      >
        <Bell className="w-5 h-5" />
        {unread.length > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-dungeon-800 border border-amber-800 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-amber-900/40">
            <p className="text-amber-500 text-xs font-bold uppercase tracking-wider">Notifications</p>
          </div>
          {notifications.length === 0 ? (
            <p className="text-stone-600 text-sm italic px-3 py-4">No notifications yet.</p>
          ) : (
            <div className="flex flex-col max-h-72 overflow-y-auto">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-3 py-2.5 border-b border-amber-900/20 text-sm ${
                    !n.readBy.includes(myId) ? 'bg-amber-900/20' : ''
                  }`}
                >
                  <p className="text-stone-200">{n.message}</p>
                  <p className="text-stone-600 text-xs mt-0.5">
                    {formatDistanceToNow(parseISO(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
