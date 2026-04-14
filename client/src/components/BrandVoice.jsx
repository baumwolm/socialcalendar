import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getExamples, createExample, deleteExample, scrapeUrl } from '../utils/api'
import { POST_TYPES } from '../utils/constants'

export default function BrandVoice({ onClose }) {
  const [copy,      setCopy]      = useState('')
  const [type,      setType]      = useState('')
  const [url,       setUrl]       = useState('')
  const [saving,    setSaving]    = useState(false)
  const [scraping,  setScraping]  = useState(false)
  const [expanded,  setExpanded]  = useState(new Set())
  const queryClient = useQueryClient()

  const { data: examples = [] } = useQuery({
    queryKey: ['examples'],
    queryFn: () => getExamples()
  })

  // Auto-fetch LinkedIn content when URL field loses focus
  async function handleUrlBlur() {
    const trimmed = url.trim()
    if (!trimmed || !trimmed.includes('linkedin.com')) return
    if (copy.trim()) return  // don't overwrite existing text
    setScraping(true)
    try {
      const result = await scrapeUrl(trimmed)
      if (result.copy) {
        setCopy(result.copy)
        toast.success('Post text pulled from LinkedIn!')
      } else {
        toast('Could not extract text automatically — paste the post below.', { icon: 'ℹ️' })
      }
    } catch {
      toast('Could not fetch the URL — paste the post text below.', { icon: 'ℹ️' })
    } finally {
      setScraping(false)
    }
  }

  async function handleFetchClick() {
    const trimmed = url.trim()
    if (!trimmed) { toast.error('Enter a LinkedIn URL first'); return }
    setScraping(true)
    try {
      const result = await scrapeUrl(trimmed)
      if (result.copy) {
        setCopy(result.copy)
        toast.success('Post text pulled!')
      } else {
        toast('Could not extract text — paste the post below.', { icon: 'ℹ️' })
      }
    } catch {
      toast('Could not fetch — paste the post text below.', { icon: 'ℹ️' })
    } finally {
      setScraping(false)
    }
  }

  async function handleAdd() {
    if (!copy.trim()) { toast.error('Paste the post text first'); return }
    setSaving(true)
    try {
      await createExample({ copy: copy.trim(), type: type || null, url: url.trim() || null })
      queryClient.invalidateQueries({ queryKey: ['examples'] })
      setCopy(''); setType(''); setUrl('')
      toast.success('Example added! Claude will learn from it.')
    } catch {
      toast.error('Failed to save example')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    try {
      await deleteExample(id)
      queryClient.invalidateQueries({ queryKey: ['examples'] })
      setExpanded(prev => { const n = new Set(prev); n.delete(id); return n })
    } catch {
      toast.error('Failed to remove')
    }
  }

  function toggleExpand(id) {
    setExpanded(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const wordCount    = copy.trim().split(/\s+/).filter(Boolean).length
  const PREVIEW_CHARS = 160

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal} className="animate-slide-up">

        {/* Header */}
        <div style={s.header}>
          <div>
            <h2 style={s.title}>Brand Voice Examples</h2>
            <p style={s.subtitle}>
              Add real Rep'd LinkedIn posts so Claude learns your style and applies it to every draft.
            </p>
          </div>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Form */}
        <div style={s.form}>
          {/* Post type */}
          <div style={s.field}>
            <label style={s.label}>POST TYPE (OPTIONAL)</label>
            <select value={type} onChange={e => setType(e.target.value)} style={s.select}>
              <option value="">Any / All types</option>
              {POST_TYPES.map(t => (
                <option key={t.label} value={t.label}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* LinkedIn URL */}
          <div style={s.field}>
            <label style={s.label}>
              LINKEDIN POST URL (OPTIONAL)
              {scraping && <span style={s.scrapingBadge}>Fetching…</span>}
            </label>
            <div style={s.urlRow}>
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onBlur={handleUrlBlur}
                style={{ ...s.input, flex: 1 }}
                placeholder="https://www.linkedin.com/posts/repd-us_…"
                disabled={scraping}
              />
              {url.trim() && (
                <button style={s.fetchBtn} onClick={handleFetchClick} disabled={scraping}>
                  ↓ Pull text
                </button>
              )}
            </div>
            <p style={s.urlHint}>Paste a URL and we'll try to pull the post text automatically.</p>
          </div>

          {/* Post copy */}
          <div style={s.field}>
            <label style={s.label}>PASTE THE POST TEXT</label>
            <textarea
              value={copy}
              onChange={e => setCopy(e.target.value)}
              style={s.textarea}
              placeholder="Paste an existing Rep'd LinkedIn post here. Claude will study the tone, structure, and style to match it in future drafts…"
              rows={5}
              disabled={scraping}
            />
            <div style={s.wordCount}>{wordCount} words</div>
          </div>

          <button style={{ ...s.addBtn, opacity: (saving || scraping) ? 0.7 : 1 }} onClick={handleAdd} disabled={saving || scraping}>
            {saving ? 'Saving…' : '+ Add Example'}
          </button>
        </div>

        {/* Saved examples */}
        <div style={s.list}>
          <div style={s.listHeader}>
            <span style={s.listCount}>{examples.length} example{examples.length !== 1 ? 's' : ''} saved</span>
            {examples.length > 0 && (
              <span style={s.listNote}>Claude uses all of these when generating drafts</span>
            )}
          </div>

          {examples.length === 0 && (
            <div style={s.empty}>
              No examples yet. Add your best-performing LinkedIn posts above to teach Claude Rep'd's voice.
            </div>
          )}

          {examples.map(ex => {
            const typeInfo   = POST_TYPES.find(t => t.label === ex.type)
            const isExpanded = expanded.has(ex.id)
            const needsToggle = ex.copy.length > PREVIEW_CHARS

            return (
              <div key={ex.id} style={s.card}>
                {/* Card header */}
                <div style={s.cardHeader}>
                  <div style={s.cardMeta}>
                    {ex.type ? (
                      <span style={{ ...s.typeBadge, background: typeInfo?.bg, color: typeInfo?.color }}>
                        {ex.type}
                      </span>
                    ) : (
                      <span style={s.anyBadge}>All types</span>
                    )}
                    {ex.url && (
                      <a href={ex.url} target="_blank" rel="noopener noreferrer" style={s.urlLink}>
                        View on LinkedIn ↗
                      </a>
                    )}
                  </div>
                  <button style={s.deleteX} onClick={() => handleDelete(ex.id)} title="Remove">✕</button>
                </div>

                {/* Card copy — expandable */}
                <div style={s.cardBody}>
                  <div style={s.cardCopy}>
                    {isExpanded || !needsToggle
                      ? ex.copy
                      : ex.copy.slice(0, PREVIEW_CHARS) + '…'
                    }
                  </div>
                  {needsToggle && (
                    <button style={s.toggleBtn} onClick={() => toggleExpand(ex.id)}>
                      {isExpanded ? '▲ Show less' : '▼ Read full post'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}

const s = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(28,35,51,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: 24,
  },
  modal: {
    background: 'var(--surface)',
    borderRadius: 12, width: '100%', maxWidth: 620, maxHeight: '88vh',
    display: 'flex', flexDirection: 'column',
    boxShadow: 'var(--shadow-lg)', overflow: 'hidden',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '20px 24px 16px',
    borderBottom: '2px solid var(--crimson)',
    flexShrink: 0,
  },
  title: { fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 4 },
  subtitle: { fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 },
  closeBtn: {
    width: 28, height: 28, borderRadius: 6,
    background: '#f3f4f6', color: 'var(--text-muted)',
    fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  form: {
    padding: '16px 24px 20px',
    borderBottom: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', gap: 12,
    flexShrink: 0,
  },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: {
    fontSize: 10, fontWeight: 700, color: 'var(--crimson)',
    textTransform: 'uppercase', letterSpacing: '0.08em',
    display: 'flex', alignItems: 'center', gap: 8,
  },
  scrapingBadge: {
    fontSize: 10, fontWeight: 500, color: '#6b7280',
    background: '#f3f4f6', padding: '2px 7px', borderRadius: 10,
  },
  select: { height: 38, padding: '0 10px', borderRadius: 6, fontSize: 13, width: '100%' },
  input:  { height: 38, padding: '0 10px', borderRadius: 6, fontSize: 13 },
  urlRow: { display: 'flex', alignItems: 'center', gap: 8 },
  fetchBtn: {
    height: 38, padding: '0 14px',
    background: 'var(--crimson-light)', color: 'var(--crimson)',
    border: '1px solid var(--crimson-border)',
    borderRadius: 6, fontSize: 12, fontWeight: 600,
    flexShrink: 0,
  },
  urlHint: {
    fontSize: 11, color: 'var(--text-light)',
    margin: 0, lineHeight: 1.5,
  },
  textarea: {
    padding: '10px 12px', borderRadius: 6, fontSize: 13,
    lineHeight: 1.7, resize: 'vertical', fontFamily: 'inherit',
    border: '1.5px solid var(--border)', width: '100%',
  },
  wordCount: { fontSize: 11, color: 'var(--text-light)', textAlign: 'right', marginTop: 2 },
  addBtn: {
    alignSelf: 'flex-start',
    padding: '8px 18px',
    background: 'var(--crimson)', color: '#fff',
    borderRadius: 6, fontWeight: 700, fontSize: 13,
  },
  list: {
    flex: 1, overflowY: 'auto',
    padding: '16px 24px',
    display: 'flex', flexDirection: 'column', gap: 10,
  },
  listHeader: {
    display: 'flex', alignItems: 'center', gap: 8,
    marginBottom: 2, flexShrink: 0,
  },
  listCount: { fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' },
  listNote:  { fontSize: 11, color: 'var(--text-light)', fontStyle: 'italic' },
  empty: {
    fontSize: 13, color: 'var(--text-light)', lineHeight: 1.7,
    background: 'var(--bg)', padding: 16, borderRadius: 8, textAlign: 'center',
  },
  card: {
    border: '1px solid var(--border)', borderRadius: 8,
    overflow: 'hidden', flexShrink: 0,
  },
  cardHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '8px 12px',
    background: 'var(--bg)',
    borderBottom: '1px solid var(--border)',
  },
  cardMeta: { display: 'flex', alignItems: 'center', gap: 8 },
  typeBadge: {
    fontSize: 11, fontWeight: 600,
    padding: '2px 8px', borderRadius: 10,
  },
  anyBadge: { fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 },
  urlLink: {
    fontSize: 11, color: 'var(--crimson)',
    fontWeight: 500, textDecoration: 'none',
  },
  deleteX: {
    width: 22, height: 22, borderRadius: 5,
    background: '#fee2e2', color: '#ef4444',
    fontSize: 11, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: 'none', flexShrink: 0, cursor: 'pointer',
  },
  cardBody: {
    padding: '10px 12px',
    background: 'var(--surface)',
  },
  cardCopy: {
    fontSize: 12, lineHeight: 1.75,
    color: 'var(--text)', whiteSpace: 'pre-wrap',
  },
  toggleBtn: {
    marginTop: 6,
    padding: '3px 0',
    background: 'none', border: 'none',
    fontSize: 11, color: 'var(--crimson)',
    fontWeight: 600, cursor: 'pointer',
  },
}
