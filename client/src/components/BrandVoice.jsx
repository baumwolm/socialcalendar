import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getExamples, createExample, deleteExample } from '../utils/api'
import { POST_TYPES } from '../utils/constants'

export default function BrandVoice({ onClose }) {
  const [copy, setCopy] = useState('')
  const [type, setType] = useState('')
  const [saving, setSaving] = useState(false)
  const queryClient = useQueryClient()

  const { data: examples = [] } = useQuery({
    queryKey: ['examples'],
    queryFn: () => getExamples()
  })

  async function handleAdd() {
    if (!copy.trim()) { toast.error('Paste a post first'); return }
    setSaving(true)
    try {
      await createExample({ copy: copy.trim(), type: type || null })
      queryClient.invalidateQueries({ queryKey: ['examples'] })
      setCopy('')
      setType('')
      toast.success('Example added! Claude will now learn from it.')
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
      toast.success('Example removed')
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal} className="animate-slide-up">
        <div style={s.header}>
          <div>
            <h2 style={s.title}>Brand Voice Examples</h2>
            <p style={s.subtitle}>Paste in real Rep'd posts so Claude learns your style and tone.</p>
          </div>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Add new example */}
        <div style={s.addBox}>
          <div style={s.fieldRow}>
            <div style={{ flex: 1 }}>
              <label style={s.label}>Post Type (optional)</label>
              <select value={type} onChange={e => setType(e.target.value)} style={s.select}>
                <option value="">Any / All types</option>
                {POST_TYPES.map(t => (
                  <option key={t.label} value={t.label}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={s.label}>Paste a real LinkedIn post from Rep'd</label>
            <textarea
              value={copy}
              onChange={e => setCopy(e.target.value)}
              style={s.textarea}
              placeholder="Paste an existing Rep'd LinkedIn post here. Claude will study the tone, structure, and style to match it in future drafts..."
              rows={6}
            />
            <div style={s.wordCount}>{copy.trim().split(/\s+/).filter(Boolean).length} words</div>
          </div>

          <button style={s.addBtn} onClick={handleAdd} disabled={saving}>
            {saving ? 'Saving…' : '+ Add Example'}
          </button>
        </div>

        {/* Existing examples */}
        <div style={s.list}>
          <div style={s.listHeader}>
            {examples.length} example{examples.length !== 1 ? 's' : ''} saved
            {examples.length > 0 && <span style={s.listNote}> — Claude uses these when generating drafts</span>}
          </div>

          {examples.length === 0 && (
            <div style={s.empty}>
              No examples yet. Add your best-performing LinkedIn posts above to give Claude a reference for Rep'd's voice.
            </div>
          )}

          {examples.map(ex => {
            const type = POST_TYPES.find(t => t.label === ex.type)
            return (
              <div key={ex.id} style={s.exampleCard}>
                <div style={s.exampleHeader}>
                  {ex.type ? (
                    <span style={{ ...s.typeBadge, background: type?.bg, color: type?.color }}>
                      {ex.type}
                    </span>
                  ) : (
                    <span style={s.anyBadge}>All types</span>
                  )}
                  <button style={s.deleteBtn} onClick={() => handleDelete(ex.id)}>Remove</button>
                </div>
                <div style={s.exampleCopy}>{ex.copy}</div>
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
    background: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: 24,
  },
  modal: {
    background: 'var(--surface)',
    borderRadius: 12,
    width: '100%', maxWidth: 680, maxHeight: '88vh',
    display: 'flex', flexDirection: 'column',
    boxShadow: 'var(--shadow-lg)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '20px 24px 16px',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
  },
  title: { fontSize: 17, fontWeight: 700, marginBottom: 4 },
  subtitle: { fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 },
  closeBtn: {
    width: 28, height: 28, borderRadius: 6,
    background: '#f3f4f6', color: 'var(--text-muted)', fontSize: 13,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  addBox: {
    padding: '16px 24px',
    borderBottom: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', gap: 10,
    flexShrink: 0,
  },
  fieldRow: { display: 'flex', gap: 12 },
  label: {
    display: 'block', fontSize: 11, fontWeight: 600,
    color: 'var(--text-muted)', textTransform: 'uppercase',
    letterSpacing: '0.05em', marginBottom: 5,
  },
  select: {
    width: '100%', height: 36, padding: '0 10px',
    borderRadius: 6, fontSize: 13,
  },
  textarea: {
    width: '100%', padding: '10px 12px',
    borderRadius: 6, fontSize: 13, lineHeight: 1.7,
    resize: 'vertical', fontFamily: 'inherit',
    border: '1px solid var(--border)',
  },
  wordCount: { fontSize: 11, color: 'var(--text-light)', marginTop: 4, textAlign: 'right' },
  addBtn: {
    alignSelf: 'flex-start',
    padding: '8px 18px',
    background: 'var(--accent)', color: '#fff',
    borderRadius: 6, fontWeight: 600, fontSize: 13,
  },
  list: { flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 },
  listHeader: { fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 },
  listNote: { fontWeight: 400, fontStyle: 'italic' },
  empty: {
    fontSize: 13, color: 'var(--text-light)', lineHeight: 1.7,
    background: '#f9fafb', padding: '16px', borderRadius: 8, textAlign: 'center',
  },
  exampleCard: {
    border: '1px solid var(--border)', borderRadius: 8,
    overflow: 'hidden',
  },
  exampleHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '8px 12px', background: '#f9fafb',
    borderBottom: '1px solid var(--border)',
  },
  typeBadge: {
    fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
  },
  anyBadge: {
    fontSize: 11, fontWeight: 500, color: 'var(--text-muted)',
  },
  deleteBtn: {
    fontSize: 11, color: '#ef4444', background: 'transparent',
    padding: '2px 6px', borderRadius: 4,
  },
  exampleCopy: {
    padding: '10px 12px', fontSize: 12,
    lineHeight: 1.7, color: 'var(--text)',
    whiteSpace: 'pre-wrap', maxHeight: 120, overflowY: 'auto',
  },
}
