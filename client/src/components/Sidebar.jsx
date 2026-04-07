import { POST_TYPES, STATUS_LABELS } from '../utils/constants'

export default function Sidebar({ activeFilter, setActiveFilter, authStatus, posts }) {
  const typeCounts = {}
  posts.forEach(p => {
    typeCounts[p.type] = (typeCounts[p.type] || 0) + 1
  })

  const totalByStatus = {}
  posts.forEach(p => {
    totalByStatus[p.status] = (totalByStatus[p.status] || 0) + 1
  })

  const isConnected = authStatus?.authenticated
  const hasClientId = authStatus?.hasClientId

  return (
    <aside style={s.sidebar}>
      {/* Logo */}
      <div style={s.logo}>
        <div style={s.logoMark}>R</div>
        <div>
          <div style={s.logoText}>Rep'd</div>
          <div style={s.logoSub}>Social Calendar</div>
        </div>
      </div>

      <div style={s.divider} />

      {/* Post type filters */}
      <div style={s.section}>
        <div style={s.sectionTitle}>Post Types</div>

        <button
          style={{ ...s.filterBtn, ...(activeFilter === null ? s.filterBtnActive : {}) }}
          onClick={() => setActiveFilter(null)}
        >
          <span style={{ ...s.dot, background: '#9ca3af' }} />
          <span>All Posts</span>
          <span style={s.count}>{posts.length}</span>
        </button>

        {POST_TYPES.map(type => (
          <button
            key={type.label}
            style={{ ...s.filterBtn, ...(activeFilter === type.label ? s.filterBtnActive : {}) }}
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

      <div style={s.divider} />

      {/* Status summary */}
      <div style={s.section}>
        <div style={s.sectionTitle}>Status</div>
        {Object.entries(STATUS_LABELS).map(([key, val]) => (
          <div key={key} style={s.statusRow}>
            <span style={{ ...s.statusBadge, background: val.bg, color: val.color }}>{val.label}</span>
            <span style={s.statusCount}>{totalByStatus[key] || 0}</span>
          </div>
        ))}
      </div>

      <div style={s.divider} />

      {/* Google Calendar sync */}
      <div style={s.section}>
        <div style={s.sectionTitle}>Google Calendar</div>
        {!hasClientId ? (
          <div style={s.gcalNote}>
            Add <code style={s.code}>GOOGLE_CLIENT_ID</code> to enable sync
          </div>
        ) : isConnected ? (
          <div style={s.gcalConnected}>
            <span style={s.gcalDot} />
            Connected
          </div>
        ) : (
          <a href="/api/auth/google" style={s.gcalBtn}>
            Connect Google Calendar
          </a>
        )}
      </div>
    </aside>
  )
}

const s = {
  sidebar: {
    gridColumn: '1',
    gridRow: '1 / 3',
    background: 'var(--surface)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    userSelect: 'none',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '20px 16px 16px',
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 8,
    background: 'var(--accent)',
    color: '#fff',
    fontSize: 18,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoText: {
    fontWeight: 700,
    fontSize: 16,
    color: 'var(--text)',
    lineHeight: 1.2,
  },
  logoSub: {
    fontSize: 11,
    color: 'var(--text-muted)',
    lineHeight: 1.2,
  },
  divider: {
    height: 1,
    background: 'var(--border)',
    margin: '0 16px',
  },
  section: {
    padding: '12px 8px',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-light)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    padding: '0 8px 8px',
  },
  filterBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '6px 8px',
    borderRadius: 6,
    background: 'transparent',
    color: 'var(--text)',
    textAlign: 'left',
    fontSize: 13,
    transition: 'background 0.1s',
  },
  filterBtnActive: {
    background: 'var(--accent-light)',
    color: 'var(--accent)',
    fontWeight: 500,
  },
  filterLabel: {
    flex: 1,
    fontSize: 12,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  count: {
    fontSize: 11,
    fontWeight: 600,
    padding: '1px 6px',
    borderRadius: 10,
    background: '#f3f4f6',
    color: 'var(--text-muted)',
    marginLeft: 'auto',
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '4px 8px',
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: 500,
    padding: '2px 8px',
    borderRadius: 10,
  },
  statusCount: {
    fontSize: 12,
    color: 'var(--text-muted)',
    fontWeight: 600,
  },
  gcalNote: {
    fontSize: 12,
    color: 'var(--text-muted)',
    padding: '4px 8px',
    lineHeight: 1.6,
  },
  code: {
    background: '#f3f4f6',
    padding: '1px 4px',
    borderRadius: 3,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  gcalConnected: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    color: '#22c55e',
    fontWeight: 500,
    padding: '4px 8px',
  },
  gcalDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#22c55e',
  },
  gcalBtn: {
    display: 'block',
    margin: '4px 8px',
    padding: '7px 10px',
    background: 'var(--accent)',
    color: '#fff',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 500,
    textDecoration: 'none',
    textAlign: 'center',
  },
}
