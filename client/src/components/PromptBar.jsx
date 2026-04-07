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
    <form
      onSubmit={handleSubmit}
      style={{
        ...s.bar,
        gridColumn: '1 / 4',
        gridRow: '2',
      }}
    >
      {/* Type selector */}
      <div style={s.typeWrapper}>
        <span style={{ ...s.typeDot, background: selectedType?.color }} />
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

      {/* Date picker */}
      <input
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
        style={s.dateInput}
        required
      />

      {/* Prompt input */}
      <input
        type="text"
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder="Describe a customer, event, employee, product, or industry update…"
        style={s.promptInput}
        disabled={loading}
      />

      {/* Submit */}
      <button type="submit" style={s.btn} disabled={loading}>
        {loading ? (
          <><span className="spinner" /> Generating…</>
        ) : (
          <><span style={s.sparkle}>✦</span> Generate Draft</>
        )}
      </button>
    </form>
  )
}

const s = {
  bar: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '0 16px',
    background: 'var(--surface)',
    borderTop: '1px solid var(--border)',
    boxShadow: '0 -2px 8px rgba(0,0,0,0.04)',
  },
  typeWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: '#f9fafb',
    border: '1px solid var(--border)',
    borderRadius: 6,
    padding: '0 10px',
    height: 38,
    flexShrink: 0,
  },
  typeDot: {
    width: 8, height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  select: {
    border: 'none',
    background: 'transparent',
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--text)',
    cursor: 'pointer',
    padding: 0,
    outline: 'none',
  },
  dateInput: {
    height: 38,
    padding: '0 10px',
    fontSize: 13,
    flexShrink: 0,
    width: 140,
  },
  promptInput: {
    flex: 1,
    height: 38,
    padding: '0 14px',
    fontSize: 14,
    borderRadius: 6,
  },
  btn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    height: 38,
    padding: '0 20px',
    background: 'var(--accent)',
    color: '#fff',
    borderRadius: 6,
    fontWeight: 600,
    fontSize: 13,
    flexShrink: 0,
    transition: 'opacity 0.1s',
  },
  sparkle: {
    fontSize: 14,
  },
}
