import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { generateDraft } from '../utils/api'
import { POST_TYPES } from '../utils/constants'
import { format } from 'date-fns'

export default function GenerateModal({ onClose, onDraftGenerated }) {
  const [prompt,   setPrompt]   = useState('')
  const [postType, setPostType] = useState(POST_TYPES[0].label)
  const [date,     setDate]     = useState(format(new Date(), 'yyyy-MM-dd'))
  const [loading,  setLoading]  = useState(false)

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!prompt.trim()) { toast.error('Describe what you want to post about'); return }
    if (!date)          { toast.error('Pick a date'); return }
    setLoading(true)
    try {
      const draft = await generateDraft({ prompt: prompt.trim(), postType })
      toast.success('Draft generated!')
      onDraftGenerated(draft, date, postType)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  const selectedType = POST_TYPES.find(t => t.label === postType)

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal} className="animate-slide-up">

        {/* Header */}
        <div style={s.header}>
          <div>
            <h2 style={s.title}>⚡ Generate Post</h2>
            <p style={s.subtitle}>Tell Claude what to write — it'll draft a LinkedIn post in your brand voice.</p>
          </div>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={s.body}>
          {/* Post type */}
          <div style={s.field}>
            <label style={s.label}>POST TYPE</label>
            <div style={s.selectWrap}>
              <span style={{ ...s.dot, background: selectedType?.color }} />
              <select
                value={postType}
                onChange={e => setPostType(e.target.value)}
                style={s.select}
              >
                {POST_TYPES.map(t => (
                  <option key={t.label} value={t.label}>{t.label}</option>
                ))}
              </select>
            </div>
            {selectedType?.description && (
              <p style={s.typeHint}>{selectedType.description}</p>
            )}
          </div>

          {/* Date */}
          <div style={s.field}>
            <label style={s.label}>SCHEDULE DATE</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={s.input}
              required
            />
          </div>

          {/* Prompt */}
          <div style={s.field}>
            <label style={s.label}>WHAT SHOULD THIS POST BE ABOUT?</label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              style={s.textarea}
              rows={5}
              placeholder="Describe a customer win, product update, event, team story, or industry take…&#10;&#10;Examples:&#10;• City of Austin saw 40% faster permit processing after deploying Rep'd&#10;• We just closed our Series A — share the news and what it means&#10;• Hot take on why most gov digital transformation fails"
              disabled={loading}
              autoFocus
            />
            <div style={s.charCount}>{prompt.length} chars</div>
          </div>

          {/* Actions */}
          <div style={s.footer}>
            <button type="button" style={s.cancelBtn} onClick={onClose}>Cancel</button>
            <button
              type="submit"
              style={{ ...s.generateBtn, opacity: loading ? 0.75 : 1 }}
              disabled={loading}
            >
              {loading
                ? <><span className="spinner" style={{ marginRight: 7 }} />Generating…</>
                : <><span style={s.bolt}>⚡</span> Generate Draft</>
              }
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}

const s = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(28,35,51,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: 24,
  },
  modal: {
    background: 'var(--surface)',
    borderRadius: 12, width: '100%', maxWidth: 560,
    maxHeight: '90vh', display: 'flex', flexDirection: 'column',
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
  body: {
    padding: '20px 24px 24px',
    overflowY: 'auto',
    display: 'flex', flexDirection: 'column', gap: 16,
  },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: {
    fontSize: 10, fontWeight: 700, color: 'var(--crimson)',
    textTransform: 'uppercase', letterSpacing: '0.08em',
  },
  selectWrap: {
    display: 'flex', alignItems: 'center', gap: 8,
    height: 40, border: '1.5px solid var(--border)',
    borderRadius: 7, padding: '0 12px', background: 'var(--surface)',
  },
  dot: { width: 9, height: 9, borderRadius: '50%', flexShrink: 0 },
  select: {
    flex: 1, border: 'none', background: 'transparent',
    fontSize: 13, color: 'var(--text)', outline: 'none', cursor: 'pointer',
  },
  typeHint: {
    fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.55,
    margin: 0, fontStyle: 'italic',
  },
  input: {
    height: 40, padding: '0 12px', borderRadius: 7, fontSize: 13,
    border: '1.5px solid var(--border)', width: '100%',
    background: 'var(--surface)', color: 'var(--text)',
  },
  textarea: {
    padding: '12px 14px', borderRadius: 7, fontSize: 13,
    lineHeight: 1.7, resize: 'vertical', fontFamily: 'inherit',
    border: '1.5px solid var(--border)', width: '100%',
    background: 'var(--surface)', color: 'var(--text)',
    minHeight: 110,
  },
  charCount: { fontSize: 11, color: 'var(--text-light)', textAlign: 'right' },
  footer: {
    display: 'flex', justifyContent: 'flex-end', gap: 10,
    paddingTop: 4,
  },
  cancelBtn: {
    padding: '9px 18px', background: 'transparent',
    color: 'var(--text-muted)', border: '1.5px solid var(--border)',
    borderRadius: 7, fontWeight: 500, fontSize: 13,
  },
  generateBtn: {
    display: 'flex', alignItems: 'center',
    padding: '9px 22px',
    background: 'var(--crimson)', color: '#fff',
    borderRadius: 7, fontWeight: 700, fontSize: 13,
  },
  bolt: { marginRight: 6, fontSize: 14 },
}
