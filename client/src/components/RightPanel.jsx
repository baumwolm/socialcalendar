import { POST_TYPE_MAP, STATUS_LABELS } from '../utils/constants'
import ImageSuggestions from './ImageSuggestions'

export default function RightPanel({ draft, selectedPost, onEditPost }) {
  if (!draft && !selectedPost) {
    return (
      <aside style={s.panel}>
        <div style={s.empty}>
          <div style={s.emptyIcon}>✦</div>
          <div style={s.emptyTitle}>Rep'd Social Calendar</div>
          <div style={s.emptyText}>
            Type a prompt in the bar below to generate a LinkedIn draft, or click any day on the calendar to add a post.
          </div>
          <div style={s.tips}>
            <div style={s.tip}><strong>Customer Launch</strong> — announce a new agency partner</div>
            <div style={s.tip}><strong>Case Study</strong> — share results with data</div>
            <div style={s.tip}><strong>New Product</strong> — tease a feature release</div>
            <div style={s.tip}><strong>Thought Leadership</strong> — bold industry take</div>
          </div>
        </div>
      </aside>
    )
  }

  if (draft && !selectedPost) {
    const type = POST_TYPE_MAP[draft.postType]
    return (
      <aside style={s.panel}>
        <div style={s.panelHeader}>
          <span style={{ ...s.typeBadge, background: type?.bg, color: type?.color }}>
            {draft.postType}
          </span>
          <span style={s.previewLabel}>Draft Preview</span>
        </div>

        <div style={s.copy}>{draft.copy}</div>

        {draft.bestTime && (
          <div style={s.bestTime}>
            <span style={s.bestTimeIcon}>🕐</span>
            <div>
              <div style={s.bestTimeLabel}>Best time to post</div>
              <div style={s.bestTimeVal}>{draft.bestTime}</div>
            </div>
          </div>
        )}

        {draft.imageQueries?.length > 0 && (
          <ImageSuggestions queries={draft.imageQueries} />
        )}

        <div style={s.panelNote}>
          Click "Approve &amp; Schedule" in the modal to save this draft to the calendar.
        </div>
      </aside>
    )
  }

  if (selectedPost) {
    const type = POST_TYPE_MAP[selectedPost.type]
    const status = STATUS_LABELS[selectedPost.status]
    return (
      <aside style={s.panel}>
        <div style={s.panelHeader}>
          <span style={{ ...s.typeBadge, background: type?.bg, color: type?.color }}>
            {selectedPost.type}
          </span>
          <span style={{ ...s.statusBadge, background: status?.bg, color: status?.color }}>
            {status?.label}
          </span>
        </div>

        <div style={s.metaRow}>
          <span style={s.metaLabel}>Scheduled</span>
          <span style={s.metaVal}>{selectedPost.date}</span>
        </div>
        {selectedPost.best_time && (
          <div style={s.metaRow}>
            <span style={s.metaLabel}>Best time</span>
            <span style={s.metaVal}>{selectedPost.best_time}</span>
          </div>
        )}

        <div style={s.copy}>{selectedPost.copy}</div>

        {selectedPost.notes && (
          <div style={s.notes}>
            <div style={s.notesLabel}>Notes</div>
            <div style={s.notesText}>{selectedPost.notes}</div>
          </div>
        )}

        {selectedPost.image_query && (
          <ImageSuggestions queries={[selectedPost.image_query]} />
        )}

        <button style={s.editBtn} onClick={() => onEditPost(selectedPost)}>
          Edit Post
        </button>
      </aside>
    )
  }
}

const s = {
  panel: {
    gridColumn: '3',
    gridRow: '1',
    background: 'var(--surface)',
    borderLeft: '1px solid var(--border)',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
  empty: {
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  emptyIcon: {
    fontSize: 28,
    color: 'var(--accent)',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--text)',
  },
  emptyText: {
    fontSize: 13,
    color: 'var(--text-muted)',
    lineHeight: 1.7,
  },
  tips: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginTop: 8,
  },
  tip: {
    fontSize: 12,
    color: 'var(--text-muted)',
    background: '#f9fafb',
    padding: '8px 12px',
    borderRadius: 6,
    lineHeight: 1.5,
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '16px 16px 12px',
    borderBottom: '1px solid var(--border)',
  },
  typeBadge: {
    fontSize: 11,
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: 10,
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: 500,
    padding: '3px 8px',
    borderRadius: 10,
    marginLeft: 'auto',
  },
  previewLabel: {
    fontSize: 11,
    color: 'var(--text-light)',
    marginLeft: 'auto',
    fontStyle: 'italic',
  },
  copy: {
    padding: '14px 16px',
    fontSize: 13,
    lineHeight: 1.75,
    color: 'var(--text)',
    whiteSpace: 'pre-wrap',
    borderBottom: '1px solid var(--border)',
  },
  bestTime: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '12px 16px',
    background: '#fffbeb',
    borderBottom: '1px solid #fef3c7',
  },
  bestTimeIcon: { fontSize: 18, flexShrink: 0 },
  bestTimeLabel: { fontSize: 11, fontWeight: 600, color: '#92400e', marginBottom: 2 },
  bestTimeVal: { fontSize: 12, color: '#78350f' },
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 16px',
    borderBottom: '1px solid var(--border)',
  },
  metaLabel: { fontSize: 11, color: 'var(--text-light)', fontWeight: 500 },
  metaVal: { fontSize: 12, color: 'var(--text)', fontWeight: 500 },
  notes: {
    padding: '12px 16px',
    background: '#fafafa',
    borderBottom: '1px solid var(--border)',
  },
  notesLabel: { fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 },
  notesText: { fontSize: 12, color: 'var(--text)', lineHeight: 1.6 },
  panelNote: {
    padding: '12px 16px',
    fontSize: 11,
    color: 'var(--text-light)',
    fontStyle: 'italic',
  },
  editBtn: {
    margin: '12px 16px',
    padding: '8px 0',
    background: 'var(--accent)',
    color: '#fff',
    borderRadius: 6,
    fontWeight: 600,
    fontSize: 13,
    textAlign: 'center',
  }
}
