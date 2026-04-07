import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
         addDays, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns'
import { POST_TYPE_MAP } from '../utils/constants'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function CalendarGrid({ currentDate, setCurrentDate, posts, loading, onDayClick, onPostClick }) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd   = endOfMonth(currentDate)
  const gridStart  = startOfWeek(monthStart)
  const gridEnd    = endOfWeek(monthEnd)

  // Build map: dateStr -> posts[]
  const postsByDate = {}
  posts.forEach(p => {
    if (!postsByDate[p.date]) postsByDate[p.date] = []
    postsByDate[p.date].push(p)
  })

  // Generate all days in the grid
  const days = []
  let day = gridStart
  while (day <= gridEnd) {
    days.push(day)
    day = addDays(day, 1)
  }

  return (
    <div style={s.wrapper}>
      {/* Calendar header */}
      <div style={s.header}>
        <button style={s.navBtn} onClick={() => setCurrentDate(subMonths(currentDate, 1))}>‹</button>
        <h2 style={s.monthTitle}>{format(currentDate, 'MMMM yyyy')}</h2>
        <button style={s.navBtn} onClick={() => setCurrentDate(addMonths(currentDate, 1))}>›</button>
        <button style={s.todayBtn} onClick={() => setCurrentDate(new Date())}>Today</button>
      </div>

      {/* Weekday headers */}
      <div style={s.weekdays}>
        {WEEKDAYS.map(d => (
          <div key={d} style={s.weekday}>{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div style={s.grid}>
        {days.map((d, i) => {
          const dateStr = format(d, 'yyyy-MM-dd')
          const dayPosts = postsByDate[dateStr] || []
          const inMonth  = isSameMonth(d, currentDate)
          const today    = isToday(d)

          return (
            <div
              key={i}
              style={{
                ...s.cell,
                ...(inMonth ? {} : s.cellOutside),
                ...(today ? s.cellToday : {})
              }}
              onClick={() => inMonth && onDayClick(dateStr)}
            >
              <div style={s.dayRow}>
                <span style={{ ...s.dayNum, ...(today ? s.dayNumToday : {}) }}>
                  {format(d, 'd')}
                </span>
                {inMonth && (
                  <button
                    style={s.addBtn}
                    onClick={e => { e.stopPropagation(); onDayClick(dateStr) }}
                    title="Add post"
                  >
                    +
                  </button>
                )}
              </div>

              {/* Post pills */}
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
                        opacity: post.status === 'published' ? 0.6 : 1,
                      }}
                      onClick={e => { e.stopPropagation(); onPostClick(post) }}
                      title={post.copy.slice(0, 100)}
                    >
                      <span style={s.pillType}>{post.type.split(' ')[0]}</span>
                      <span style={s.pillCopy}>{post.copy.slice(0, 28)}…</span>
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

      {loading && <div style={s.loading}>Loading posts…</div>}
    </div>
  )
}

const s = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
    background: 'var(--bg)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '14px 20px',
    background: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 600,
    margin: '0 4px',
    flex: 1,
  },
  navBtn: {
    width: 32, height: 32,
    borderRadius: 6,
    background: 'transparent',
    color: 'var(--text)',
    fontSize: 20,
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.1s',
  },
  todayBtn: {
    padding: '5px 12px',
    borderRadius: 6,
    background: 'var(--accent-light)',
    color: 'var(--accent)',
    fontWeight: 500,
    fontSize: 13,
  },
  weekdays: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    background: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
  },
  weekday: {
    padding: '8px 0',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
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
    padding: '6px 8px',
    background: 'var(--surface)',
    minHeight: 90,
    cursor: 'pointer',
    transition: 'background 0.1s',
    overflow: 'hidden',
  },
  cellOutside: {
    background: '#fafafa',
    cursor: 'default',
  },
  cellToday: {
    background: '#eff6ff',
  },
  dayRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dayNum: {
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--text-muted)',
    lineHeight: 1,
  },
  dayNumToday: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: 'var(--accent)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 12,
  },
  addBtn: {
    width: 18, height: 18,
    borderRadius: '50%',
    background: 'transparent',
    color: 'var(--text-light)',
    fontSize: 16,
    lineHeight: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transition: 'opacity 0.1s',
  },
  pills: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  pill: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '2px 5px',
    borderRadius: 3,
    fontSize: 10,
    fontWeight: 500,
    textAlign: 'left',
    border: 'none',
    cursor: 'pointer',
    width: '100%',
    overflow: 'hidden',
    lineHeight: 1.4,
    transition: 'filter 0.1s',
  },
  pillType: {
    fontWeight: 700,
    flexShrink: 0,
    fontSize: 9,
    textTransform: 'uppercase',
  },
  pillCopy: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
  },
  morePill: {
    fontSize: 10,
    color: 'var(--text-muted)',
    padding: '1px 4px',
  },
  loading: {
    position: 'absolute',
    top: 80,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(255,255,255,0.9)',
    padding: '6px 14px',
    borderRadius: 6,
    fontSize: 12,
    color: 'var(--text-muted)',
    boxShadow: 'var(--shadow)',
  }
}
