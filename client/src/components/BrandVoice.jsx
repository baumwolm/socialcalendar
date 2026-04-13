import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getExamples, createExample, deleteExample } from '../utils/api'
import { POST_TYPES } from '../utils/constants'

export default function BrandVoice({ onClose }) {
  const [copy,   setCopy]   = useState('')
  const [type,   setType]   = useState('')
  const [url,    setUrl]    = useState('')
  const [saving, setSaving] = useState(false)
  const queryClient = useQueryClient()

  const { data: examples = [] } = useQuery({
    queryKey: ['examples'],
    queryFn: () => getExamples()
  })

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
    } catch {
      toast.error('Failed to remove')
    }
  }

  const wordCount = copy.trim().split(/\s+/).filter(Boolean).length

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal} className="animate-slide-up">

        {/* Header */}
        <div style={s.header}>
          <div>
            <h2 style={s.title}>Brand Voice Examples</h2>
            <p style={s.subtitle}>Paste in real Rep'd posts so Claude learns your style and tone.</p>
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
            <label style={s.label}>LINKEDIN POST URL (OPTIONAL)</label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              style={s.input}
              placeholder="https://www.linkedin.com/posts/repd-us_..."
            />
          </div>

          {/* Post copy */}
          <div style={s.field}>
            <label style={s.label}>PASTE THE POST TEXT</label>
            <textarea
              value={copy}
              onChange={e => setCopy(e.target.value)}
              style={s.textarea}
              placeholder="Paste an existing Rep'd LinkedIn post here. Claude will study the tone, structure, and style to match it in future drafts..."
              rows={5}
            />
            <div style={s.wordCount}>{wordCount} words</div>
          </div>

          <button style={{ ...s.addBtn, opacity: saving ? 0.7 : 1 }} onClick={handleAdd} disabled={saving}>
            {saving ? 'Saving…' : '+ Add Example'}
          </button>
        </div>

        {/* Saved examples */}
        <div style={s.list}>
          <div style={s.listHeader}>
            <span style={s.listCount}>{examples.length} example{examples.length !== 1 ? 's' : ''} saved</span>
            {examples.length > 0 && <span style={s.listNote}>Claude uses these when generating drafts</span>}
          </div>

          {examples.length === 0 && (
            <div style={s.empty}>
              No examples yet. Add your best-performing LinkedIn posts above to teach Claude Rep'd's voice.
            </div>
          )}

          {examples.map(ex => {
            const typeInfo = POST_TYPES.find(t => t.label === ex.type)
            return (
              <div key={ex.id} style={s.card}>
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
                <div style={s.cardCopy}>{ex.copy}</div>
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
  },
  select: { height: 38, padding: '0 10px', borderRadius: 6, fontSize: 13, width: '100%' },
  input:  { height: 38, padding: '0 10px', borderRadius: 6, fontSize: 13, width: '100%' },
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
  // Saved examples list
  list: {
    flex: 1, overflowY: 'auto',
    padding: '16px 24px',
    display: 'flex', flexDirection: 'column', gap: 10,
  },
  listHeader: {
    display: 'flex', alignItems: 'center', gap: 8,
    marginBottom: 2,
  },
  listCount: { fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' },
  listNote:  { fontSize: 11, color: 'var(--text-light)', fontStyle: 'italic' },
  empty: {
    fontSize: 13, color: 'var(--text-light)', lineHeight: 1.7,
    background: 'var(--bg)', padding: 16, borderRadius: 8, textAlign: 'center',
  },
  card: {
    border: '1px solid var(--border)', borderRadius: 8,
    overflow: 'hidden',
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
    border: 'none', flexShrink: 0,
  },
  cardCopy: {
    padding: '10px 12px',
    fontSize: 12, lineHeight: 1.75,
    color: 'var(--text)', whiteSpace: 'pre-wrap',
    background: 'var(--surface)',
  },
}
