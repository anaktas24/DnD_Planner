import { useState, useEffect } from 'react'
import { Swords, Menu, Sword } from 'lucide-react'
import { D20Icon } from './D20Icon'
import { formatDistanceToNow, parseISO, isPast } from 'date-fns'
import { useCampaignStore } from '../store/useCampaignStore'
import { ToolsMenu, ProfileButton } from './ToolsMenu'
import { SessionMenu } from './SessionMenu'

const BLOG_SEEN_KEY = 'dnd_blog_last_seen'
const PLAYER_ID_KEY = 'dnd_player_id'

type View = 'home' | 'blog' | 'admin' | 'initiative'

interface Props {
  onMenuClick: () => void
  onNavigate: (view: View) => void
}

export function CampaignHeader({ onMenuClick, onNavigate }: Props) {
  const campaign = useCampaignStore((s) => s.campaign)
  const blogPosts = useCampaignStore((s) => s.blogPosts)
  const [lastSeen, setLastSeen] = useState(() => localStorage.getItem(BLOG_SEEN_KEY) ?? '')
  const [, setTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000)
    return () => clearInterval(interval)
  }, [])

  const hasUnreadBlog = blogPosts.length > 0 && (lastSeen === '' || blogPosts.some((p) => p.createdAt > lastSeen))

  const myId = localStorage.getItem(PLAYER_ID_KEY)
  const myRole = myId ? (campaign?.roles?.[myId] ?? 'player') : 'player'
  const isAdmin = myRole === 'admin'

  function openStory() {
    const now = new Date().toISOString()
    localStorage.setItem(BLOG_SEEN_KEY, now)
    setLastSeen(now)
    window.location.hash = 'story'
  }

  if (!campaign) return null

  const nextSession = campaign.nextSessionDate ? parseISO(campaign.nextSessionDate) : null
  const countdown =
    nextSession && !isPast(nextSession)
      ? formatDistanceToNow(nextSession, { addSuffix: true })
      : null

  return (
    <header className="bg-dungeon-900 border-b-2 border-amber-700 px-4 md:px-6 py-2">
      {/* Main row */}
      <div className="flex items-center justify-between gap-2">

        {/* Left */}
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={onMenuClick} className="md:hidden text-amber-600 hover:text-amber-400 transition-colors shrink-0">
            <Menu className="w-6 h-6" />
          </button>
          <button
            onClick={() => onNavigate('home')}
            className="text-amber-500 hover:text-amber-300 transition-colors shrink-0"
            title="Home"
          >
            <D20Icon className="w-6 h-6 md:w-8 md:h-8" />
          </button>
          <h1
            className="text-sm md:text-xl font-bold text-amber-400 truncate max-w-[95px] sm:max-w-[200px] md:max-w-none"
            style={{ fontFamily: 'Cinzel Decorative, serif' }}
          >
            {campaign.name}
          </h1>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 text-stone-300 text-sm">
            <Swords className="w-6 h-6 text-amber-600" />
            <span>Session <span className="text-amber-400 font-bold text-2xl">#{campaign.sessionCount}</span></span>
            {countdown && (
              <>
                <span className="text-stone-600">·</span>
                <span className="text-amber-400 font-semibold text-xl">{countdown}</span>
                {campaign.nextSessionTime && (
                  <span className="text-amber-600 text-xl">· {campaign.nextSessionTime}</span>
                )}
              </>
            )}
          </div>

          <button
            onClick={openStory}
            className={`relative text-sm md:text-base font-semibold transition-colors hidden sm:block ${
              hasUnreadBlog ? 'text-amber-200 hover:text-amber-100' : 'text-amber-400 hover:text-amber-300'
            }`}
            style={{
              fontFamily: 'Cinzel, serif',
              ...(hasUnreadBlog ? { textShadow: '0 0 10px rgba(251,191,36,1), 0 0 24px rgba(251,191,36,0.6)' } : {}),
            }}
          >
            The Story So Far
            {hasUnreadBlog && (
              <span className="absolute -top-1 -right-2 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            )}
          </button>

          <div className="flex items-center gap-1 border-l border-amber-900 pl-2 md:pl-3">
            {/* Admin-only: initiative tracker + session menu */}
            {isAdmin && (
              <>
                <button
                  onClick={() => onNavigate('initiative')}
                  className="p-2 rounded-lg text-stone-500 hover:text-amber-400 transition-colors"
                  title="Initiative Tracker"
                >
                  <Sword className="w-5 h-5" />
                </button>
                <SessionMenu />
              </>
            )}
            <ProfileButton />
            <ToolsMenu onNavigate={onNavigate} />
          </div>
        </div>
      </div>

      {/* Mobile second row */}
      <div className="flex sm:hidden items-center justify-between mt-1.5 pt-1.5 border-t border-amber-900/30">
        <div className="flex items-center gap-1.5 text-stone-400 text-xs">
          <Swords className="w-3.5 h-3.5 text-amber-600" />
          <span>Session <span className="text-amber-400 font-bold">#{campaign.sessionCount}</span></span>
          {countdown && (
            <>
              <span className="text-stone-600">·</span>
              <span className="text-amber-400 font-semibold">{countdown}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <button onClick={() => onNavigate('initiative')} className="text-stone-500 hover:text-amber-400 transition-colors" title="Initiative">
                <Sword className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            onClick={openStory}
            className={`relative text-xs font-semibold transition-colors ${
              hasUnreadBlog ? 'text-amber-200' : 'text-amber-400'
            }`}
            style={{
              fontFamily: 'Cinzel, serif',
              ...(hasUnreadBlog ? { textShadow: '0 0 10px rgba(251,191,36,1), 0 0 24px rgba(251,191,36,0.6)' } : {}),
            }}
          >
            The Story So Far
            {hasUnreadBlog && (
              <span className="absolute -top-1 -right-2 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
