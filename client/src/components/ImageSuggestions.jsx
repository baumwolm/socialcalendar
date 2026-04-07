export default function ImageSuggestions({ queries = [] }) {
  if (!queries.length) return null

  return (
    <div style={s.wrapper}>
      <div style={s.label}>Image Suggestions</div>
      <div style={s.chips}>
        {queries.map((q, i) => (
          <a
            key={i}
            href={`https://unsplash.com/s/photos/${encodeURIComponent(q)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={s.chip}
            title={`Search Unsplash for "${q}"`}
          >
            <span style={s.chipIcon}>🖼</span>
            {q}
          </a>
        ))}
      </div>
      <div style={s.note}>Click a chip to search Unsplash in a new tab</div>
    </div>
  )
}

const s = {
  wrapper: {
    padding: '12px 16px',
    borderBottom: '1px solid var(--border)',
  },
  label: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 8,
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '5px 10px',
    background: '#eff6ff',
    color: '#1d4ed8',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 500,
    textDecoration: 'none',
    border: '1px solid #bfdbfe',
    transition: 'background 0.1s',
  },
  chipIcon: { fontSize: 12 },
  note: {
    marginTop: 6,
    fontSize: 10,
    color: 'var(--text-light)',
    fontStyle: 'italic',
  }
}
