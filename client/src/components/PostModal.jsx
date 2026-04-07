import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { createPost, updatePost, deletePost, syncToCalendar, generateDraft } from '../utils/api'
import { POST_TYPES, POST_TYPE_MAP, STATUS_LABELS, STATUSES } from '../utils/constants'
import ImageSuggestions from './ImageSuggestions'

export default function PostModal({ post, draft, defaultDate, onClose, onSaved, authStatus }) {
  const isEdit = !!post

  const [type,       setType]       = useState(post?.type       || draft?.postType || POST_TYPES[0].label)
  const [date,       setDate]       = useState(post?.date       || draft?.date     || defaultDate || '')
  const [copy,       setCopy]       = useState(post?.copy       || draft?.copy     || '')
  const [status,     setStatus]     = useState(post?.status     || 'draft')
  const [imageQuery, setImageQuery] = useState(post?.image_query || (draft?.imageQueries?.[0]) || '')
  const [imageUrl,   setImageUrl]   = useState(post?.image_url  || '')
  const [notes,      setNotes]      = useState(post?.notes      || '')
  const [bestTime,   setBestTime]   = useState(post?.best_time  || draft?.bestTime || '')
  const [imageQueries, setImageQueries] = useState(draft?.imageQueries || [])

  const [saving,      setSaving]      = useState(false)
  const [deleting,    setDeleting]    = useState(false)
  const [syncing,     setSyncing]     = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const selectedType = POST_TYPE_MAP[type]
  const wordCount = copy.trim().split(/\s+/).filter(Boolean).length

  async function handleSave() {
    if (!type || !date || !copy.trim()) {
      toast.error('Post type, date, and copy are required')
      return
    }

    setSaving(true)
    try {
      const data = { type, date, copy: copy.trim(), status, image_query: imageQuery, image_url: imageUrl, notes, best_time: bestTime }
      if (isEdit) {
        await updatePost(post.id, data)
        toast.success('Post updated')
      } else {
        await createPost(data)
        toast.success('Post saved to calendar!')
      }
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    try {
      await deletePost(post.id)
      toast.success('Post deleted')
      onSaved()
    } catch (err) {
      toast.error('Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  async function handleSync() {
    if (!post?.id) {
      toast.error('Save the post first before syncing')
      return
    }
    setSyncing(true)
    try {
      const result = await syncToCalendar(post.id)
      toast.success('Synced to Google Calendar!')
      if (result.eventLink) window.open(result.eventLink, '_blank')
    } catch (err) {
      const msg = err.response?.data?.error || 'Sync failed'
      if (msg.includes('Not authenticated')) {
        toast.error('Connect Google Calendar first (see sidebar)')
      } else {
        toast.error(msg)
      }
    } finally {
      setSyncing(false)
    }
  }

  async function handleRegenerate() {
    const promptText = window.prompt('Enter a new or updated prompt to regenerate:')
    if (!promptText?.trim()) return

    setRegenerating(true)
    try {
      const result = await generateDraft({ prompt: promptText.trim(), postType: type })
      setCopy(result.copy)
      setBestTime(result.bestTime)
      setImageQuery(result.imageQueries?.[0] || '')
      setImageQueries(result.imageQueries || [])
      toast.success('Draft regenerated!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Regeneration failed')
    } finally {
      setRegenerating(false)
    }
  }

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal} className="animate-slide-up">
        {/* Header */}
        <div style={{ ...s.header, borderBottom: `3px solid ${selectedType?.color || '#e5e7eb'}` }}>
          <div style={s.headerLeft}>
            <span style={{ ...s.typeDot, background: selectedType?.color }} />
            <h2 style={s.title}>{isEdit ? 'Edit Post' : 'New Draft'}</h2>
          </div>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={s.body}>
          {/* Left column — main content */}
          <div style={s.left}>
            {/* Post type + date row */}
            <div style={s.row}>
              <div style={s.field}>
                <label style={s.label}>Post Type</label>
                <div style={s.selectWrapper}>
                  <span style={{ ...s.selectDot, background: selectedType?.color }} />
                  <select value={type} onChange={e => setType(e.target.value)} style={s.select}>
                    {POST_TYPES.map(t => (
                      <option key={t.label} value={t.label}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  style={s.input}
                />
              </div>

              <div style={s.field}>
                <label style={s.label}>Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)} style={s.select}>
                  {STATUSES.map(st => (
                    <option key={st} value={st}>{STATUS_LABELS[st].label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Copy editor */}
            <div style={s.field}>
              <div style={s.labelRow}>
                <label style={s.label}>Post Copy</label>
                <span style={{ ...s.wordCount, color: wordCount > 250 ? '#ef4444' : wordCount > 200 ? '#f59e0b' : '#22c55e' }}>
                  {wordCount} / 250 words
                </span>
              </div>
              <textarea
                value={copy}
                onChange={e => setCopy(e.target.value)}
                style={s.textarea}
                placeholder="Write your LinkedIn post here, or generate one with the prompt bar below…"
                rows={12}
              />
            </div>

            {/* Best time + image query */}
            <div style={s.row}>
              <div style={{ ...s.field, flex: 2 }}>
                <label style={s.label}>Best Time to Post</label>
                <input
                  type="text"
                  value={bestTime}
                  onChange={e => setBestTime(e.target.value)}
                  style={s.input}
                  placeholder="e.g. Tuesday–Thursday, 8–10 AM"
                />
              </div>
              <div style={{ ...s.field, flex: 3 }}>
                <label style={s.label}>Image Search Query</label>
                <input
                  type="text"
                  value={imageQuery}
                  onChange={e => setImageQuery(e.target.value)}
                  style={s.input}
                  placeholder="e.g. government digital transformation"
                />
              </div>
            </div>

            {/* Image URL */}
            <div style={s.field}>
              <label style={s.label}>Image URL (optional)</label>
              <input
                type="url"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                style={s.input}
                placeholder="Paste an image URL to attach to this post"
              />
              {imageUrl && (
                <img src={imageUrl} alt="Post preview" style={s.imagePreview} onError={e => e.target.style.display = 'none'} />
              )}
            </div>

            {/* Notes / collaboration */}
            <div style={s.field}>
              <label style={s.label}>Notes / Team Suggestions</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                style={{ ...s.textarea, fontSize: 12, minHeight: 60 }}
                placeholder="Leave feedback or suggestions for the team…"
                rows={3}
              />
            </div>
          </div>

          {/* Right column — preview + suggestions */}
          <div style={s.right}>
            {/* LinkedIn preview */}
            <div style={s.preview}>
              <div style={s.previewHeader}>
                <div style={s.previewAvatar}>R</div>
                <div>
                  <div style={s.previewName}>Rep'd</div>
                  <div style={s.previewMeta}>GovTech SaaS · LinkedIn</div>
                </div>
              </div>
              <div style={s.previewCopy}>
                {copy || <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>Your post will appear here…</span>}
              </div>
            </div>

            {/* Status flow */}
            <div style={s.statusFlow}>
              {STATUSES.map((st, i) => {
                const info = STATUS_LABELS[st]
                const isActive = status === st
                const isPast = STATUSES.indexOf(status) > i
                return (
                  <div key={st} style={s.statusStep}>
                    <div style={{
                      ...s.statusCircle,
                      background: isActive ? info.color : isPast ? '#d1fae5' : '#f3f4f6',
                      color: isActive ? '#fff' : isPast ? '#059669' : '#9ca3af',
                      border: `2px solid ${isActive ? info.color : isPast ? '#6ee7b7' : '#e5e7eb'}`,
                    }}>
                      {isPast ? '✓' : i + 1}
                    </div>
                    <span style={{ ...s.statusLabel, color: isActive ? info.color : isPast ? '#059669' : '#9ca3af', fontWeight: isActive ? 600 : 400 }}>
                      {info.label}
                    </span>
                    {i < STATUSES.length - 1 && <div style={s.statusLine} />}
                  </div>
                )
              })}
            </div>

            {/* Image suggestions */}
            {imageQueries.length > 0 && (
              <ImageSuggestions queries={imageQueries} />
            )}

            {/* Best time tip */}
            {bestTime && (
              <div style={s.tip}>
                <span style={s.tipIcon}>🕐</span>
                <div>
                  <div style={s.tipLabel}>Best time to post</div>
                  <div style={s.tipVal}>{bestTime}</div>
                </div>
              </div>
            )}

            {/* Google calendar sync */}
            {isEdit && (
              <div style={s.syncBox}>
                <div style={s.syncTitle}>Google Calendar</div>
                {post?.google_event_id ? (
                  <div style={s.syncedBadge}>
                    <span>✓</span> Synced to Calendar
                  </div>
                ) : (
                  <div style={s.syncNote}>
                    Mark as "Scheduled" and sync to create a calendar event.
                  </div>
                )}
                <button
                  style={{ ...s.syncBtn, opacity: syncing ? 0.7 : 1 }}
                  onClick={handleSync}
                  disabled={syncing}
                >
                  {syncing ? <><span className="spinner" /> Syncing…</> : post?.google_event_id ? 'Update Calendar Event' : 'Sync to Google Calendar'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div style={s.footer}>
          <div style={s.footerLeft}>
            {isEdit && (
              <button
                style={{ ...s.btnDanger, opacity: deleting ? 0.7 : 1 }}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : confirmDelete ? 'Confirm Delete' : 'Delete'}
              </button>
            )}
            {confirmDelete && (
              <button style={s.btnGhost} onClick={() => setConfirmDelete(false)}>
                Cancel
              </button>
            )}
          </div>

          <div style={s.footerRight}>
            <button
              style={{ ...s.btnGhost, opacity: regenerating ? 0.7 : 1 }}
              onClick={handleRegenerate}
              disabled={regenerating}
            >
              {regenerating ? <><span className="spinner" /> Regenerating…</> : '↺ Regenerate'}
            </button>

            <button style={s.btnGhost} onClick={onClose}>
              Cancel
            </button>

            <button
              style={{ ...s.btnPrimary, opacity: saving ? 0.7 : 1 }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <><span className="spinner" /> Saving…</> : isEdit ? 'Save Changes' : '✓ Approve & Schedule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const s = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 24,
  },
  modal: {
    background: 'var(--surface)',
    borderRadius: 12,
    width: '100%',
    maxWidth: 960,
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'var(--shadow-lg)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  typeDot: {
    width: 12, height: 12,
    borderRadius: '50%',
    flexShrink: 0,
  },
  title: {
    fontSize: 17,
    fontWeight: 700,
  },
  closeBtn: {
    width: 28, height: 28,
    borderRadius: 6,
    background: '#f3f4f6',
    color: 'var(--text-muted)',
    fontSize: 13,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  body: {
    display: 'flex',
    gap: 0,
    flex: 1,
    overflow: 'hidden',
  },
  left: {
    flex: 1,
    padding: '16px 20px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    borderRight: '1px solid var(--border)',
  },
  right: {
    width: 280,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  },
  row: {
    display: 'flex',
    gap: 12,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
    flex: 1,
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  wordCount: {
    fontSize: 11,
    fontWeight: 600,
  },
  input: {
    height: 36,
    padding: '0 10px',
    borderRadius: 6,
  },
  selectWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    height: 36,
    border: '1px solid var(--border)',
    borderRadius: 6,
    padding: '0 10px',
    background: 'var(--surface)',
  },
  selectDot: {
    width: 8, height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  select: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    fontSize: 13,
    color: 'var(--text)',
    outline: 'none',
    cursor: 'pointer',
  },
  textarea: {
    padding: '10px 12px',
    borderRadius: 6,
    resize: 'vertical',
    fontSize: 13,
    lineHeight: 1.7,
    minHeight: 120,
    fontFamily: 'inherit',
  },
  imagePreview: {
    width: '100%',
    maxHeight: 120,
    objectFit: 'cover',
    borderRadius: 6,
    marginTop: 6,
  },
  // LinkedIn preview card
  preview: {
    margin: 16,
    border: '1px solid var(--border)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 12px',
    background: '#f9fafb',
    borderBottom: '1px solid var(--border)',
  },
  previewAvatar: {
    width: 32, height: 32,
    borderRadius: '50%',
    background: 'var(--accent)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  previewName: { fontSize: 13, fontWeight: 600 },
  previewMeta: { fontSize: 10, color: 'var(--text-light)' },
  previewCopy: {
    padding: '10px 12px',
    fontSize: 11.5,
    lineHeight: 1.7,
    color: 'var(--text)',
    whiteSpace: 'pre-wrap',
    maxHeight: 160,
    overflowY: 'auto',
  },
  // Status flow
  statusFlow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    padding: '12px 16px',
    borderBottom: '1px solid var(--border)',
  },
  statusStep: {
    display: 'flex',
    alignItems: 'center',
    gap: 0,
  },
  statusCircle: {
    width: 24, height: 24,
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11,
    fontWeight: 700,
    flexShrink: 0,
  },
  statusLabel: {
    fontSize: 10,
    marginLeft: 4,
    marginRight: 4,
  },
  statusLine: {
    width: 20,
    height: 2,
    background: '#e5e7eb',
    margin: '0 2px',
  },
  tip: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    padding: '10px 16px',
    background: '#fffbeb',
    borderBottom: '1px solid #fef3c7',
  },
  tipIcon: { fontSize: 16, flexShrink: 0, marginTop: 1 },
  tipLabel: { fontSize: 10, fontWeight: 600, color: '#92400e', marginBottom: 2 },
  tipVal: { fontSize: 11, color: '#78350f' },
  syncBox: {
    padding: '12px 16px',
    borderBottom: '1px solid var(--border)',
  },
  syncTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 8,
  },
  syncedBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 12,
    color: '#22c55e',
    fontWeight: 500,
    marginBottom: 8,
  },
  syncNote: {
    fontSize: 11,
    color: 'var(--text-light)',
    marginBottom: 8,
    lineHeight: 1.5,
  },
  syncBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
    padding: '7px 0',
    background: '#f0fdf4',
    color: '#16a34a',
    border: '1px solid #86efac',
    borderRadius: 6,
    fontWeight: 500,
    fontSize: 12,
  },
  // Footer
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    borderTop: '1px solid var(--border)',
    background: '#fafafa',
    flexShrink: 0,
  },
  footerLeft: {
    display: 'flex',
    gap: 8,
  },
  footerRight: {
    display: 'flex',
    gap: 8,
  },
  btnPrimary: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 20px',
    background: 'var(--accent)',
    color: '#fff',
    borderRadius: 6,
    fontWeight: 600,
    fontSize: 13,
  },
  btnGhost: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    background: 'transparent',
    color: 'var(--text-muted)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    fontWeight: 500,
    fontSize: 13,
  },
  btnDanger: {
    padding: '8px 14px',
    background: '#fef2f2',
    color: '#ef4444',
    border: '1px solid #fecaca',
    borderRadius: 6,
    fontWeight: 500,
    fontSize: 13,
  },
}
