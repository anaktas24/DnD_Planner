import { useState, useEffect } from 'react'
import { collection, doc, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { BlogPost, Campaign } from '../types'
import { format, parseISO } from 'date-fns'
import { PenLine, Trash2, X, Save, Plus, ArrowLeft } from 'lucide-react'
import { upsertBlogPost, deleteBlogPost } from '../lib/firestore'
import { D20Icon } from './D20Icon'

const PLAYER_ID_KEY = 'dnd_player_id'
const CAMPAIGN_ID = 'main'

export function StoryReader() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [editing, setEditing] = useState<Partial<BlogPost> | null>(null)
  const [saving, setSaving] = useState(false)

  const myId = localStorage.getItem(PLAYER_ID_KEY)
  const myRole = myId ? (campaign?.roles?.[myId] ?? 'player') : 'player'
  const canWrite = myRole === 'admin' || myRole === 'editor'

  useEffect(() => {
    const unsub1 = onSnapshot(
      query(collection(db, 'campaigns', CAMPAIGN_ID, 'blog'), orderBy('createdAt', 'desc')),
      (snap) => setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as BlogPost)))
    )
    const unsub2 = onSnapshot(doc(db, 'campaigns', CAMPAIGN_ID), (snap) => {
      if (snap.exists()) setCampaign(snap.data() as Campaign)
    })
    return () => { unsub1(); unsub2() }
  }, [])

  async function save() {
    if (!editing?.title?.trim() || !editing?.content?.trim() || !myId) return
    setSaving(true)
    await upsertBlogPost({
      id: editing.id,
      title: editing.title,
      content: editing.content,
      authorId: myId,
      authorName: editing.authorName ?? 'Unknown',
      createdAt: editing.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    setSaving(false)
    setEditing(null)
  }

  async function remove(postId: string) {
    if (!confirm('Delete this entry?')) return
    await deleteBlogPost(postId)
  }

  function goBack() {
    window.history.back()
  }

  return (
    <div className="min-h-screen bg-dungeon-900 text-stone-200" style={{ fontFamily: 'IM Fell English, Georgia, serif' }}>
      {/* Header */}
      <header className="border-b border-amber-800/50 bg-dungeon-900/95 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <D20Icon className="w-6 h-6 text-amber-500" />
            <div>
              <h1 className="text-amber-400 font-bold text-lg leading-none" style={{ fontFamily: 'Cinzel Decorative, serif' }}>
                The Story So Far
              </h1>
              {campaign?.name && (
                <p className="text-stone-500 text-xs mt-0.5" style={{ fontFamily: 'Cinzel, serif' }}>
                  {campaign.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canWrite && !editing && (
              <button
                onClick={() => setEditing({ title: '', content: '' })}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-amber-700 text-amber-400 hover:bg-amber-900/30 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                New Entry
              </button>
            )}
            <button
              onClick={goBack}
              className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-amber-400 transition-colors px-2 py-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        {/* Editor */}
        {editing && (
          <div className="bg-dungeon-800 border border-amber-800 rounded-xl p-5 mb-10 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-amber-400 font-semibold text-sm uppercase tracking-wider" style={{ fontFamily: 'Cinzel, serif' }}>
                {editing.id ? 'Edit Entry' : 'New Entry'}
              </h3>
              <button onClick={() => setEditing(null)}>
                <X className="w-4 h-4 text-stone-500 hover:text-stone-300" />
              </button>
            </div>
            <input
              className="bg-dungeon-900 border border-amber-900/60 text-stone-200 rounded-lg px-3 py-2 text-base font-semibold placeholder-stone-600 focus:outline-none focus:border-amber-600 transition-colors w-full"
              placeholder="Title..."
              value={editing.title ?? ''}
              onChange={(e) => setEditing((f) => ({ ...f, title: e.target.value }))}
            />
            <textarea
              className="bg-dungeon-900 border border-amber-900/60 text-stone-200 rounded-lg px-3 py-2 text-sm placeholder-stone-600 focus:outline-none focus:border-amber-600 transition-colors w-full resize-none leading-relaxed"
              rows={12}
              placeholder="Write your session recap here..."
              value={editing.content ?? ''}
              onChange={(e) => setEditing((f) => ({ ...f, content: e.target.value }))}
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditing(null)} className="text-stone-500 hover:text-stone-300 text-sm px-3 py-1.5">
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving || !editing.title?.trim() || !editing.content?.trim()}
                className="flex items-center gap-2 bg-amber-700 hover:bg-amber-600 text-amber-100 font-semibold rounded-lg px-4 py-2 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Publish'}
              </button>
            </div>
          </div>
        )}

        {posts.length === 0 && !editing && (
          <div className="text-center py-24">
            <p className="text-stone-600 italic text-lg">The tale has not yet been written...</p>
          </div>
        )}

        <div className="flex flex-col gap-16">
          {posts.map((post, i) => (
            <article key={post.id}>
              {/* Ornamental divider between entries */}
              {i > 0 && (
                <div className="flex items-center gap-4 mb-16">
                  <div className="flex-1 h-px bg-amber-900/40" />
                  <span className="text-amber-800 text-lg">⬡</span>
                  <div className="flex-1 h-px bg-amber-900/40" />
                </div>
              )}

              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h2
                    className="text-amber-300 font-bold text-2xl md:text-3xl leading-tight"
                    style={{ fontFamily: 'Cinzel, serif' }}
                  >
                    {post.title}
                  </h2>
                  <p className="text-stone-600 text-sm mt-2" style={{ fontFamily: 'Cinzel, serif' }}>
                    {format(parseISO(post.createdAt), 'MMMM d, yyyy')}
                    <span className="mx-2 text-stone-700">·</span>
                    {post.authorName}
                    {post.updatedAt !== post.createdAt && <span className="text-stone-700"> · edited</span>}
                  </p>
                </div>
                {canWrite && (
                  <div className="flex gap-1 shrink-0 mt-1">
                    <button
                      onClick={() => setEditing({ ...post })}
                      className="p-1.5 text-stone-600 hover:text-amber-400 transition-colors"
                    >
                      <PenLine className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => remove(post.id)}
                      className="p-1.5 text-stone-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <p className="text-stone-300 leading-8 text-base md:text-lg whitespace-pre-wrap">
                {post.content}
              </p>
            </article>
          ))}
        </div>
      </main>
    </div>
  )
}
