import { useState } from 'react'
import toast from 'react-hot-toast'
import { generateDraft } from '../utils/api'
import { POST_TYPES } from '../utils/constants'
import { format } from 'date-fns'

export default function PromptBar({ onDraftGenerated }) {
  const [prompt, setPrompt] = useState('')
  const [postType, setPostType] = useState(POST_TYPES[0].label)
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!prompt.trim()) { toast.error('Add a prompt first'); return }
    if (!date) { toast.error('Pick a date'); return }
    setLoading(true)
    try {
      const draft = await generateDraft({ prompt: prompt.trim(), postType })
      onDraftGenerated(draft, date, postType)
      setPrompt('')
      toast.success('Draft generated!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  const selectedType = POST_TYPES.find(t => t.label === postType)

  return (
    <form onSubmit={handleSubmit} style={s.bar}>
      {/* Type pill */}
      <div style={s.typeWrapper}>
        <span style={{ ...s.typeDot, background: selectedType?.color }} />
        <select
          value={postType}
          onChange={e => setPostType(e.target.value)}
          style={s.typeSelect}
        >
          {POST_TYPES.map(t => (
            <option key={t.label} value={t.label}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Date */}
      <input
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
        style={s.dateInput}
        required
      />

      {/* Prompt */}
      <input
        type="text"
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder="Describe a customer win, product update, event, team member, or industry take…"
        style={s.promptInput}
        disabled={loading}
      />

      {/* Generate */}
      <button type="submit" style={{ ...s.btn, opacity: loading ? 0.75 : 1 }} disabled={loading}>
        {loading
          ? <><span className="spinner" style={{ marginRight: 6 }} />Generating…</>
          : <><span style={s.bolt}>⚡</span> Generate Draft</>
        }
      </button>
    </form>
  )
}

const s = {
  bar: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '0 20px',
    height: 'var(--bar-height)',
    background: 'var(--surface)',
    borderTop: '1px solid var(--border)',
    boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
    flexShrink: 0,
  },
  typeWrapper: {
    display: 'flex', alignItems: 'center', gap: 7,
    background: '#f9fafb',
    border: '1.5px solid var(--border)',
    borderRadius: 7, padding: '0 10px',
    height: 40, flexShrink: 0,
  },
  typeDot: {
    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
  },
  typeSelect: {
    border: 'none', background: 'transparent',
    fontSize: 12, fontWeight: 500, color: 'var(--text)',
    cursor: 'pointer', padding: 0, outline: 'none',
    maxWidth: 180,
  },
  dateInput: {
    height: 40, padding: '0 10px',
    fontSize: 13, flexShrink: 0, width: 140,
    borderRadius: 7,
  },
  promptInput: {
    flex: 1, height: 40, padding: '0 14px',
    fontSize: 14, borderRadius: 7,
  },
  btn: {
    display: 'flex', alignItems: 'center',
    height: 40, padding: '0 22px',
    background: 'var(--crimson)',
    color: '#fff', borderRadius: 7,
    fontWeight: 700, fontSize: 13,
    flexShrink: 0, letterSpacing: '0.01em',
    transition: 'background 0.15s',
  },
  bolt: { marginRight: 5, fontSize: 14 },
}
