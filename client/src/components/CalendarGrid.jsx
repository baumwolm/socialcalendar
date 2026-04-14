import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
         addDays, isSameMonth, addMonths, subMonths, isToday } from 'date-fns'
import { POST_TYPE_MAP, TEAM_MEMBER_MAP } from '../utils/constants'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function CalendarGrid({ currentDate, setCurrentDate, posts, loading, onDayClick, onPostClick }) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd   = endOfMonth(currentDate)
  const gridStart  = startOfWeek(monthStart)
  const gridEnd    = endOfWeek(monthEnd)

  const postsByDate = {}
  posts.forEach(p => {
    if (!postsByDate[p.date]) postsByDate[p.date] = []
    postsByDate[p.date].push(p)
  })

  const days = []
  let day = gridStart
  while (day <= gridEnd) { days.push(day); day = addDays(day, 1) }

  return (
    <div style={s.wrapper}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.navGroup}>
          <button style={s.navBtn} onClick={() => setCurrentDate(subMonths(currentDate, 1))}>‹</button>
          <h2 style={s.monthTitle}>{format(currentDate, 'MMMM yyyy')}</h2>
          <button style={s.navBtn} onClick={() => setCurrentDate(addMonths(currentDate, 1))}>›</button>
        </div>
        <button style={s.todayBtn} onClick={() => setCurrentDate(new Date())}>Today</button>
      </div>

      {/* Weekday labels */}
      <div style={s.weekdays}>
        {WEEKDAYS.map(d => <div key={d} style={s.weekday}>{d}</div>)}
      </div>

      {/* Grid */}
      <div style={s.grid}>
        {days.map((d, i) => {
          const dateStr  = format(d, 'yyyy-MM-dd')
          const dayPosts = postsByDate[dateStr] || []
          const inMonth  = isSameMonth(d, currentDate)
          const today    = isToday(d)

          return (
            <div
              key={i}
              style={{
                ...s.cell,
                ...(inMonth ? {} : s.cellOutside),
                ...(today ? s.cellToday : {}),
              }}
              onClick={() => inMonth && onDayClick(dateStr)}
            >
              <div style={s.dayRow}>
                <span style={today ? s.dayNumToday : s.dayNum}>{format(d, 'd')}</span>
                {inMonth && (
                  <button
                    style={s.addBtn}
                    className="add-btn"
                    onClick={e => { e.stopPropagation(); onDayClick(dateStr) }}
                    title="Add post"
                  >+</button>
                )}
              </div>

              <div style={s.pills}>
                {dayPosts.slice(0, 3).map(post => {
                  const type = POST_TYPE_MAP[post.type]
                  return (
                    <button
                      key={post.id}
                      style={{
                        ...s.pill,
                        background: type?.bg || '#f3f4f6',
                        color: type?.color || '#374151',
                        borderLeft: `3px solid ${type?.color || '#9ca3af'}`,
                        opacity: post.status === 'published' ? 0.55 : 1,
                      }}
                      onClick={e => { e.stopPropagation(); onPostClick(post) }}
                    >
                      <span style={s.pillCopy}>{post.copy.slice(0, 30)}…</span>
                      {post.assigned_to && TEAM_MEMBER_MAP[post.assigned_to] && (
                        <span style={{
                          ...s.pillAvatar,
                          background: TEAM_MEMBER_MAP[post.assigned_to].color,
                        }}>
                          {TEAM_MEMBER_MAP[post.assigned_to].initials}
                        </span>
                      )}
                    </button>
                  )
                })}
                {dayPosts.length > 3 && (
                  <div style={s.morePill}>+{dayPosts.length - 3} more</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {loading && <div style={s.loadingBadge}>Loading…</div>}
    </div>
  )
}

const s = {
  wrapper: {
    display: 'flex', flexDirection: 'column',
    height: '100%', overflow: 'hidden',
    background: 'var(--bg)',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 20px',
    background: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
  },
  navGroup: {
    display: 'flex', alignItems: 'center', gap: 4,
  },
  monthTitle: {
    fontSize: 17, fontWeight: 700,
    color: 'var(--text)',
    padding: '0 10px',
    minWidth: 160, textAlign: 'center',
  },
  navBtn: {
    width: 32, height: 32, borderRadius: 6,
    background: 'transparent', color: 'var(--text-muted)',
    fontSize: 20, lineHeight: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.1s',
  },
  todayBtn: {
    padding: '6px 14px', borderRadius: 6,
    background: 'var(--crimson-light)',
    color: 'var(--crimson)',
    fontWeight: 600, fontSize: 12,
    border: '1px solid var(--crimson-border)',
  },
  weekdays: {
    display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
    background: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
  },
  weekday: {
    padding: '8px 0', textAlign: 'center',
    fontSize: 10, fontWeight: 700,
    color: 'var(--text-light)',
    textTransform: 'uppercase', letterSpacing: '0.07em',
  },
  grid: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gridAutoRows: '1fr',
    overflow: 'auto',
    borderLeft: '1px solid var(--border)',
    borderTop: '1px solid var(--border)',
  },
  cell: {
    borderRight: '1px solid var(--border)',
    borderBottom: '1px solid var(--border)',
    padding: '7px 8px 6px',
    background: 'var(--surface)',
    minHeight: 96,
    cursor: 'pointer',
    transition: 'background 0.1s',
    overflow: 'hidden',
  },
  cellOutside: {
    background: 'var(--bg)',
    cursor: 'default',
  },
  cellToday: {
    background: '#fff9fa',
  },
  dayRow: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  dayNum: {
    fontSize: 12, fontWeight: 500,
    color: 'var(--text-muted)',
  },
  dayNumToday: {
    width: 22, height: 22, borderRadius: '50%',
    background: 'var(--crimson)',
    color: '#fff',
    fontSize: 11, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  addBtn: {
    width: 18, height: 18, borderRadius: '50%',
    background: 'transparent',
    color: 'var(--text-light)',
    fontSize: 16, lineHeight: '18px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    opacity: 0, transition: 'opacity 0.1s',
  },
  pills: {
    display: 'flex', flexDirection: 'column', gap: 2,
  },
  pill: {
    display: 'flex', alignItems: 'center',
    padding: '2px 6px',
    borderRadius: 4,
    fontSize: 10, fontWeight: 500,
    textAlign: 'left', border: 'none',
    cursor: 'pointer', width: '100%',
    overflow: 'hidden', lineHeight: 1.4,
  },
  pillCopy: {
    overflow: 'hidden', textOverflow: 'ellipsis',
    whiteSpace: 'nowrap', flex: 1,
  },
  pillAvatar: {
    width: 14, height: 14, borderRadius: '50%',
    color: '#fff', fontSize: 7, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginLeft: 3,
  },
  morePill: {
    fontSize: 10, color: 'var(--text-light)', padding: '1px 4px',
  },
  loadingBadge: {
    position: 'absolute', top: 80, left: '50%',
    transform: 'translateX(-50%)',
    background: 'var(--surface)', padding: '5px 14px',
    borderRadius: 6, fontSize: 11,
    color: 'var(--text-muted)', boxShadow: 'var(--shadow)',
  },
}
