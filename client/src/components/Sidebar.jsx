import { POST_TYPES, STATUS_LABELS } from '../utils/constants'

export default function Sidebar({ activeFilter, setActiveFilter, authStatus, posts }) {
  const typeCounts = {}
  posts.forEach(p => { typeCounts[p.type] = (typeCounts[p.type] || 0) + 1 })

  const isConnected = authStatus?.authenticated
  const hasClientId = authStatus?.hasClientId

  return (
    <aside style={s.sidebar}>
      {/* Post type filters */}
      <div style={s.section}>
        <div style={s.sectionTitle}>Post Types</div>

        <button
          style={{ ...s.filterBtn, ...(activeFilter === null ? s.filterActive : {}) }}
          onClick={() => setActiveFilter(null)}
        >
          <span style={{ ...s.dot, background: '#9ca3af' }} />
          <span style={s.filterLabel}>All Posts</span>
          <span style={s.count}>{posts.length}</span>
        </button>

        {POST_TYPES.map(type => (
          <button
            key={type.label}
            style={{ ...s.filterBtn, ...(activeFilter === type.label ? s.filterActive : {}) }}
            onClick={() => setActiveFilter(activeFilter === type.label ? null : type.label)}
          >
            <span style={{ ...s.dot, background: type.color }} />
            <span style={s.filterLabel}>{type.label}</span>
            {typeCounts[type.label] ? (
              <span style={{ ...s.count, background: type.bg, color: type.color }}>
                {typeCounts[type.label]}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Google Calendar */}
      <div style={s.footer}>
        <div style={s.sectionTitle}>Google Calendar</div>
        {!hasClientId ? (
          <div style={s.gcalNote}>Add <code style={s.code}>GOOGLE_CLIENT_ID</code> to .env to enable sync</div>
        ) : isConnected ? (
          <div style={s.gcalConnected}><span style={s.gcalDot} />Connected</div>
        ) : (
          <a href="/api/auth/google" style={s.gcalBtn}>Connect Google Calendar</a>
        )}
      </div>
    </aside>
  )
}

const s = {
  sidebar: {
    width: 'var(--sidebar-width)',
    background: 'var(--surface)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    flexShrink: 0,
  },
  section: {
    padding: '16px 10px 8px',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--crimson)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    padding: '0 6px 8px',
  },
  filterBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '6px 8px',
    borderRadius: 6,
    background: 'transparent',
    color: 'var(--text-muted)',
    textAlign: 'left',
    fontSize: 12,
    transition: 'background 0.1s',
  },
  filterActive: {
    background: 'var(--crimson-light)',
    color: 'var(--crimson)',
    fontWeight: 600,
  },
  filterLabel: {
    flex: 1,
    fontSize: 12,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  dot: {
    width: 8, height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  count: {
    fontSize: 10, fontWeight: 700,
    padding: '1px 6px',
    borderRadius: 10,
    background: '#f3f4f6',
    color: 'var(--text-muted)',
    marginLeft: 'auto',
    flexShrink: 0,
  },
  footer: {
    padding: '12px 10px 16px',
    borderTop: '1px solid var(--border)',
  },
  gcalNote: {
    fontSize: 11, color: 'var(--text-light)',
    padding: '4px 6px', lineHeight: 1.6,
  },
  code: {
    background: '#f3f4f6', padding: '1px 4px',
    borderRadius: 3, fontSize: 10, fontFamily: 'monospace',
  },
  gcalConnected: {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 12, color: '#16a34a', fontWeight: 500,
    padding: '4px 6px',
  },
  gcalDot: {
    width: 7, height: 7, borderRadius: '50%', background: '#22c55e',
  },
  gcalBtn: {
    display: 'block',
    margin: '4px 6px 0',
    padding: '7px 10px',
    background: 'var(--crimson)',
    color: '#fff', borderRadius: 6,
    fontSize: 12, fontWeight: 600,
    textDecoration: 'none', textAlign: 'center',
  },
}
