import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { PenLine, Trash2, X, Save } from 'lucide-react'
import { useCampaignStore } from '../store/useCampaignStore'
import { upsertBlogPost, deleteBlogPost } from '../lib/firestore'
import type { BlogPost } from '../types'


export function BlogPage() {
  const { blogPosts, campaign, players } = useCampaignStore()
  const myId = useCampaignStore((s) => s.activePlayerId)
  const myRole = myId ? (campaign?.roles?.[myId] ?? 'player') : 'player'
  const canWrite = myRole === 'admin' || myRole === 'editor'

  const [editing, setEditing] = useState<Partial<BlogPost> | null>(null)
  const [saving, setSaving] = useState(false)

  function startNew() {
    setEditing({ title: '', content: '' })
  }

  function startEdit(post: BlogPost) {
    setEditing({ ...post })
  }

  async function save() {
    if (!editing?.title?.trim() || !editing?.content?.trim() || !myId) return
    setSaving(true)
    const me = players.find((p) => p.id === myId)
    await upsertBlogPost({
      id: editing.id,
      title: editing.title,
      content: editing.content,
      authorId: myId,
      authorName: me?.characterName ?? me?.name ?? 'Unknown',
      createdAt: editing.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    setSaving(false)
    setEditing(null)
  }

  async function remove(postId: string) {
    if (!confirm('Delete this post?')) return
    await deleteBlogPost(postId)
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
      <div className="max-w-2xl w-full mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-amber-400" style={{ fontFamily: 'Cinzel, serif' }}>
              The Story So Far...
            </h2>
            <p className="text-stone-500 text-sm mt-0.5">Chronicles of {campaign?.name}</p>
          </div>
          {canWrite && !editing && (
            <button onClick={startNew} className="btn-primary flex items-center gap-2">
              <PenLine className="w-4 h-4" />
              New Entry
            </button>
          )}
        </div>

        {/* Editor */}
        {editing && (
          <div className="bg-dungeon-800 border border-amber-800 rounded-xl p-5 mb-6 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-amber-400 font-semibold text-sm uppercase tracking-wider">
                {editing.id ? 'Edit Entry' : 'New Entry'}
              </h3>
              <button onClick={() => setEditing(null)}><X className="w-4 h-4 text-stone-500 hover:text-stone-300" /></button>
            </div>
            <input
              className="input-field text-base font-semibold"
              placeholder="Title..."
              value={editing.title ?? ''}
              onChange={(e) => setEditing((f) => ({ ...f, title: e.target.value }))}
            />
            <textarea
              className="input-field resize-none leading-relaxed"
              rows={10}
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
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Publish'}
              </button>
            </div>
          </div>
        )}

        {/* Posts */}
        {blogPosts.length === 0 && !editing && (
          <div className="text-center py-16">
            <p className="text-stone-600 text-sm italic">No entries yet. The tale has not been written...</p>
          </div>
        )}

        <div className="flex flex-col gap-6">
          {blogPosts.map((post) => (
            <article key={post.id} className="bg-dungeon-800 border border-amber-900/30 rounded-xl p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-amber-300 font-bold text-lg" style={{ fontFamily: 'Cinzel, serif' }}>
                    {post.title}
                  </h3>
                  <p className="text-stone-600 text-xs mt-0.5">
                    By {post.authorName} · {format(parseISO(post.createdAt), 'MMM d, yyyy')}
                    {post.updatedAt !== post.createdAt && ' (edited)'}
                  </p>
                </div>
                {canWrite && (
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(post)}
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
              <p className="text-stone-300 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
