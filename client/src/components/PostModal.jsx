import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { createPost, updatePost, deletePost, syncToCalendar, generateDraft, refineCopy, uploadMedia, getComments, createComment, deleteComment } from '../utils/api'
import { POST_TYPES, POST_TYPE_MAP, STATUS_LABELS, STATUSES, TEAM_MEMBERS, TEAM_MEMBER_MAP } from '../utils/constants'

export default function PostModal({ post, draft, defaultDate, onClose, onSaved, authStatus }) {
  const isEdit = !!post

  const [type,         setType]         = useState(post?.type        || draft?.postType || POST_TYPES[0].label)
  const [date,         setDate]         = useState(post?.date        || draft?.date     || defaultDate || '')
  const [copy,         setCopy]         = useState(post?.copy        || draft?.copy     || '')
  const [status,       setStatus]       = useState(post?.status      || 'draft')
  const [imageQuery,   setImageQuery]   = useState(post?.image_query || draft?.imageQueries?.[0] || '')
  const [imageUrl,     setImageUrl]     = useState(post?.image_url   || '')
  const [notes,        setNotes]        = useState(post?.notes       || '')
  const [bestTime,     setBestTime]     = useState(post?.best_time   || draft?.bestTime || '')
  const [assignedTo,   setAssignedTo]   = useState(post?.assigned_to || '')
  const [imageQueries, setImageQueries] = useState(draft?.imageQueries || [])

  const [saving,        setSaving]        = useState(false)
  const [deleting,      setDeleting]      = useState(false)
  const [syncing,       setSyncing]       = useState(false)
  const [regenerating,  setRegenerating]  = useState(false)
  const [refining,      setRefining]      = useState(null)
  const [uploading,     setUploading]     = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [mediaType,     setMediaType]     = useState(
    post?.image_url?.match(/\.(mp4|mov|avi|webm)/i) ? 'video' : 'image'
  )
  const [newCommentText, setNewCommentText] = useState('')
  const [commentAuthor,  setCommentAuthor]  = useState(TEAM_MEMBERS[0].id)
  const [addingComment,  setAddingComment]  = useState(false)

  const fileInputRef = useRef(null)

  const { data: comments = [], refetch: refetchComments } = useQuery({
    queryKey: ['comments', post?.id],
    queryFn:  () => getComments(post.id),
    enabled:  isEdit && !!post?.id,
  })

  const selectedType = POST_TYPE_MAP[type]
  const wordCount    = copy.trim().split(/\s+/).filter(Boolean).length

  async function handleSave() {
    if (!type || !date || !copy.trim()) { toast.error('Type, date, and copy are required'); return }
    setSaving(true)
    try {
      const data = { type, date, copy: copy.trim(), status, image_query: imageQuery, image_url: imageUrl, notes, best_time: bestTime, assigned_to: assignedTo || null }
      isEdit ? await updatePost(post.id, data) : await createPost(data)
      toast.success(isEdit ? 'Post updated' : 'Post saved to calendar!')
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed')
    } finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    try { await deletePost(post.id); toast.success('Post deleted'); onSaved() }
    catch { toast.error('Delete failed') } finally { setDeleting(false) }
  }

  async function handleSync() {
    if (!post?.id) { toast.error('Save the post first'); return }
    setSyncing(true)
    try {
      const result = await syncToCalendar(post.id)
      toast.success('Synced to Google Calendar!')
      if (result.eventLink) window.open(result.eventLink, '_blank')
    } catch (err) {
      const msg = err.response?.data?.error || 'Sync failed'
      toast.error(msg.includes('Not authenticated') ? 'Connect Google Calendar first (see sidebar)' : msg)
    } finally { setSyncing(false) }
  }

  async function handleRegenerate() {
    const p = window.prompt('Enter a new prompt to regenerate:')
    if (!p?.trim()) return
    setRegenerating(true)
    try {
      const result = await generateDraft({ prompt: p.trim(), postType: type })
      setCopy(result.copy); setBestTime(result.bestTime)
      setImageQuery(result.imageQueries?.[0] || ''); setImageQueries(result.imageQueries || [])
      toast.success('Draft regenerated!')
    } catch (err) { toast.error(err.response?.data?.error || 'Regeneration failed')
    } finally { setRegenerating(false) }
  }

  async function handleRefine(instruction) {
    if (!copy.trim()) { toast.error('No copy to refine'); return }
    setRefining(instruction)
    try { const result = await refineCopy(copy, instruction); setCopy(result.copy); toast.success('Copy updated!')
    } catch (err) { toast.error(err.response?.data?.error || 'Refine failed')
    } finally { setRefining(null) }
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    try {
      const result = await uploadMedia(file)
      setImageUrl(result.url); setMediaType(result.mimetype.startsWith('video') ? 'video' : 'image')
      toast.success('Media uploaded!')
    } catch (err) { toast.error(err.response?.data?.error || 'Upload failed')
    } finally { setUploading(false); e.target.value = '' }
  }

  async function handleAddComment() {
    if (!newCommentText.trim()) { toast.error('Type a comment first'); return }
    setAddingComment(true)
    try {
      await createComment(post.id, { author: commentAuthor, text: newCommentText.trim() })
      setNewCommentText(''); refetchComments()
    } catch { toast.error('Failed to add comment') } finally { setAddingComment(false) }
  }

  async function handleDeleteComment(cid) {
    try { await deleteComment(post.id, cid); refetchComments() }
    catch { toast.error('Failed to remove comment') }
  }

  function handleCopyToClipboard() {
    if (!copy.trim()) { toast.error('Nothing to copy'); return }
    navigator.clipboard.writeText(copy.trim()).then(() => toast.success('Copied!')).catch(() => toast.error('Copy failed'))
  }

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  const assignedMember = assignedTo ? TEAM_MEMBER_MAP[assignedTo] : null

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal} className="animate-slide-up">
        <div style={s.header}>
          <div style={s.headerLeft}>
            <span style={{ ...s.typeDot, background: selectedType?.color }} />
            <h2 style={s.title}>{isEdit ? 'Edit Post' : 'New Draft'}</h2>
            <span style={{ ...s.statusPill, background: STATUS_LABELS[status]?.bg, color: STATUS_LABELS[status]?.color }}>
              {STATUS_LABELS[status]?.label}
            </span>
            {assignedMember && (
              <div style={{ ...s.headerAvatar, background: assignedMember.color }}>{assignedMember.initials}</div>
            )}
          </div>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={s.body}>
          <div style={s.left}>
            {/* Type / Date / Status */}
            <div style={s.row}>
              <div style={s.field}>
                <label style={s.fieldLabel}>POST TYPE</label>
                <div style={s.selectWrap}>
                  <span style={{ ...s.selectDot, background: selectedType?.color }} />
                  <select value={type} onChange={e => setType(e.target.value)} style={s.select}>
                    {POST_TYPES.map(t => <option key={t.label} value={t.label}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={s.field}>
                <label style={s.fieldLabel}>DATE</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} style={s.input} />
              </div>
              <div style={s.field}>
                <label style={s.fieldLabel}>STATUS</label>
                <select value={status} onChange={e => setStatus(e.target.value)} style={s.input}>
                  {STATUSES.map(st => <option key={st} value={st}>{STATUS_LABELS[st].label}</option>)}
                </select>
              </div>
            </div>

            {/* Assigned to */}
            <div style={s.field}>
              <label style={s.fieldLabel}>ASSIGNED TO</label>
              <div style={s.memberRow}>
                <button style={{ ...s.memberBtn, ...(assignedTo === '' ? s.memberBtnSelected : {}) }}
                  onClick={() => setAssignedTo('')}>
                  <div style={{ ...s.memberAvatar, background: '#e5e7eb', color: '#6b7280' }}>—</div>
                  <span style={s.memberName}>None</span>
                </button>
                {TEAM_MEMBERS.map(m => (
                  <button key={m.id}
                    style={{ ...s.memberBtn, ...(assignedTo === m.id ? { ...s.memberBtnSelected, boxShadow: `0 0 0 2px ${m.color}` } : {}) }}
                    onClick={() => setAssignedTo(m.id)}>
                    <div style={{ ...s.memberAvatar, background: m.color }}>{m.initials}</div>
                    <span style={s.memberName}>{m.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Copy */}
            <div style={s.field}>
              <div style={s.fieldLabelRow}>
                <label style={s.fieldLabel}>POST COPY</label>
                <div style={s.copyMeta}>
                  <span style={{ ...s.wordCount, color: wordCount > 250 ? '#ef4444' : wordCount > 200 ? '#f59e0b' : '#16a34a' }}>
                    {wordCount} / 250 words
                  </span>
                  <button style={s.copyClipBtn} onClick={handleCopyToClipboard}>📋 Copy Post</button>
                </div>
              </div>
              <textarea value={copy} onChange={e => setCopy(e.target.value)}
                style={s.textarea} placeholder="Write or generate your LinkedIn post here…" rows={9} />
              <div style={s.refineRow}>
                <span style={s.refineHint}>Quick edit:</span>
                {[{key:'shorter',label:'Shorter'},{key:'much_shorter',label:'Much Shorter'},{key:'more_human',label:'More Human'}].map(btn => (
                  <button key={btn.key} style={{ ...s.refineBtn, opacity: refining ? 0.6 : 1 }}
                    onClick={() => handleRefine(btn.key)} disabled={!!refining}>
                    {refining === btn.key ? <><span className="spinner" /> {btn.label}…</> : btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Media */}
            <div style={s.field}>
              <label style={s.fieldLabel}>IMAGE / VIDEO</label>
              <div style={s.uploadRow}>
                <input ref={fileInputRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleFileUpload} />
                <button style={s.uploadBtn} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? <><span className="spinner" /> Uploading…</> : '⬆ Upload'}
                </button>
                <span style={s.orDivider}>or</span>
                <input type="url" value={imageUrl} onChange={e => { setImageUrl(e.target.value); setMediaType('image') }}
                  style={{ ...s.input, flex: 1 }} placeholder="Paste a URL" />
                {imageUrl && <button style={s.clearBtn} onClick={() => setImageUrl('')}>✕</button>}
              </div>
              {imageUrl && mediaType === 'image' && <img src={imageUrl} alt="Preview" style={s.mediaPreview} onError={e => e.target.style.display='none'} />}
              {imageUrl && mediaType === 'video' && <video src={imageUrl} controls style={s.mediaPreview} />}
            </div>

            {/* Best time */}
            <div style={s.field}>
              <label style={s.fieldLabel}>BEST TIME TO POST</label>
              <input type="text" value={bestTime} onChange={e => setBestTime(e.target.value)}
                style={s.input} placeholder="e.g. Tuesday–Thursday, 8–10 AM" />
            </div>

            {/* Notes */}
            <div style={s.field}>
              <label style={s.fieldLabel}>NOTES</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                style={{ ...s.textarea, minHeight: 60 }} rows={2} placeholder="Internal notes or reminders…" />
            </div>

            {/* Comments — saved posts only */}
            {isEdit && (
              <div style={s.field}>
                <label style={s.fieldLabel}>TEAM COMMENTS</label>
                {comments.length > 0 && (
                  <div style={s.commentList}>
                    {comments.map(c => {
                      const m = TEAM_MEMBER_MAP[c.author]
                      return (
                        <div key={c.id} style={s.comment}>
                          <div style={{ ...s.commentAvatar, background: m?.color || '#9ca3af' }}>{m?.initials || c.author}</div>
                          <div style={s.commentBody}>
                            <div style={s.commentMeta}>
                              <span style={s.commentAuthorName}>{m?.name || c.author}</span>
                              <span style={s.commentTime}>{new Date(c.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>
                            </div>
                            <div style={s.commentText}>{c.text}</div>
                          </div>
                          <button style={s.commentDeleteBtn} onClick={() => handleDeleteComment(c.id)} title="Remove">✕</button>
                        </div>
                      )
                    })}
                  </div>
                )}
                <div style={s.commentForm}>
                  <div style={s.commentAuthorRow}>
                    {TEAM_MEMBERS.map(m => (
                      <button key={m.id} title={m.name}
                        style={{ ...s.commentAvatarBtn, background: m.color, boxShadow: commentAuthor===m.id ? `0 0 0 2px #fff, 0 0 0 4px ${m.color}` : 'none' }}
                        onClick={() => setCommentAuthor(m.id)}>{m.initials}</button>
                    ))}
                    <span style={s.commentingAs}>as <strong>{TEAM_MEMBER_MAP[commentAuthor]?.name}</strong></span>
                  </div>
                  <div style={s.commentInputRow}>
                    <input type="text" value={newCommentText} onChange={e => setNewCommentText(e.target.value)}
                      onKeyDown={e => e.key==='Enter' && !e.shiftKey && handleAddComment()}
                      style={{ ...s.input, flex: 1 }} placeholder="Add a comment… (Enter to submit)" disabled={addingComment} />
                    <button style={{ ...s.commentSubmit, opacity: addingComment ? 0.6 : 1 }}
                      onClick={handleAddComment} disabled={addingComment}>Post</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right panel */}
          <div style={s.right}>
            <div style={s.previewLabel}>LinkedIn Preview</div>
            <div style={s.previewCard}>
              <div style={s.previewHeader}>
                <div style={s.previewAvatar}>R</div>
                <div><div style={s.previewName}>Rep'd</div><div style={s.previewMeta}>GovTech · LinkedIn</div></div>
              </div>
              <div style={s.previewBody}>
                {copy || <span style={{color:'var(--text-light)',fontStyle:'italic'}}>Your post will appear here…</span>}
              </div>
            </div>
            {imageQueries.length > 0 && (
              <div style={s.suggestions}>
                <div style={s.suggestTitle}>IMAGE IDEAS</div>
                {imageQueries.map((q,i) => (
                  <a key={i} href={`https://unsplash.com/s/photos/${encodeURIComponent(q)}`}
                    target="_blank" rel="noopener noreferrer" style={s.chip}>🖼 {q}</a>
                ))}
              </div>
            )}
            {bestTime && (
              <div style={s.timeBox}>
                <span style={s.timeIcon}>🕐</span>
                <div><div style={s.timeLabel}>BEST TIME TO POST</div><div style={s.timeVal}>{bestTime}</div></div>
              </div>
            )}
            {isEdit && (
              <div style={s.syncBox}>
                <div style={s.suggestTitle}>GOOGLE CALENDAR</div>
                {post?.google_event_id && <div style={s.syncedBadge}>✓ Synced</div>}
                <button style={{ ...s.syncBtn, opacity: syncing ? 0.7 : 1 }} onClick={handleSync} disabled={syncing}>
                  {syncing ? <><span className="spinner" /> Syncing…</> : post?.google_event_id ? 'Update Event' : 'Sync to Calendar'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div style={s.footer}>
          <div style={s.footerLeft}>
            {isEdit && (
              <button style={s.btnDanger} onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : confirmDelete ? 'Confirm Delete?' : 'Delete'}
              </button>
            )}
            {confirmDelete && <button style={s.btnGhost} onClick={() => setConfirmDelete(false)}>Cancel</button>}
          </div>
          <div style={s.footerRight}>
            <button style={{ ...s.btnGhost, opacity: regenerating ? 0.7 : 1 }} onClick={handleRegenerate} disabled={regenerating}>
              {regenerating ? <><span className="spinner" /> Regenerating…</> : '↺ Regenerate'}
            </button>
            <button style={s.btnGhost} onClick={onClose}>Cancel</button>
            <button style={{ ...s.btnPrimary, opacity: saving ? 0.7 : 1 }} onClick={handleSave} disabled={saving}>
              {saving ? <><span className="spinner" /> Saving…</> : isEdit ? 'Save Changes' : '⚡ Approve & Schedule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const s = {
  overlay: { position:'fixed',inset:0,background:'rgba(28,35,51,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:24 },
  modal: { background:'var(--surface)',borderRadius:12,width:'100%',maxWidth:980,maxHeight:'90vh',display:'flex',flexDirection:'column',boxShadow:'var(--shadow-lg)',overflow:'hidden' },
  header: { display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderBottom:'2px solid var(--crimson)',flexShrink:0 },
  headerLeft: { display:'flex',alignItems:'center',gap:10 },
  typeDot: { width:12,height:12,borderRadius:'50%',flexShrink:0 },
  title: { fontSize:16,fontWeight:700,color:'var(--text)' },
  statusPill: { fontSize:11,fontWeight:600,padding:'2px 9px',borderRadius:10 },
  headerAvatar: { width:24,height:24,borderRadius:'50%',color:'#fff',fontSize:10,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center' },
  closeBtn: { width:28,height:28,borderRadius:6,background:'#f3f4f6',color:'var(--text-muted)',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center' },
  body: { display:'flex',flex:1,overflow:'hidden' },
  left: { flex:1,padding:'16px 20px',overflowY:'auto',display:'flex',flexDirection:'column',gap:14,borderRight:'1px solid var(--border)' },
  right: { width:264,overflowY:'auto',flexShrink:0,display:'flex',flexDirection:'column' },
  row: { display:'flex',gap:12 },
  field: { display:'flex',flexDirection:'column',gap:5,flex:1 },
  fieldLabelRow: { display:'flex',justifyContent:'space-between',alignItems:'center' },
  fieldLabel: { fontSize:10,fontWeight:700,color:'var(--crimson)',textTransform:'uppercase',letterSpacing:'0.08em' },
  memberRow: { display:'flex',gap:7,flexWrap:'wrap' },
  memberBtn: { display:'flex',alignItems:'center',gap:6,padding:'5px 11px',background:'var(--bg)',border:'1.5px solid var(--border)',borderRadius:7,cursor:'pointer' },
  memberBtnSelected: { background:'var(--surface)' },
  memberAvatar: { width:24,height:24,borderRadius:'50%',color:'#fff',fontSize:10,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 },
  memberName: { fontSize:12,fontWeight:500,color:'var(--text)' },
  copyMeta: { display:'flex',alignItems:'center',gap:8 },
  wordCount: { fontSize:11,fontWeight:600 },
  copyClipBtn: { padding:'3px 9px',background:'#f0fdf4',color:'#16a34a',border:'1px solid #86efac',borderRadius:5,fontSize:11,fontWeight:600 },
  input: { height:38,padding:'0 10px',borderRadius:6,fontSize:13,width:'100%' },
  selectWrap: { display:'flex',alignItems:'center',gap:7,height:38,border:'1.5px solid var(--border)',borderRadius:6,padding:'0 10px',background:'var(--surface)' },
  selectDot: { width:8,height:8,borderRadius:'50%',flexShrink:0 },
  select: { flex:1,border:'none',background:'transparent',fontSize:13,color:'var(--text)',outline:'none',cursor:'pointer' },
  textarea: { padding:'10px 12px',borderRadius:6,resize:'vertical',fontSize:13,lineHeight:1.75,minHeight:100,fontFamily:'inherit',width:'100%' },
  refineRow: { display:'flex',alignItems:'center',gap:6,marginTop:4 },
  refineHint: { fontSize:11,color:'var(--text-light)',flexShrink:0 },
  refineBtn: { display:'flex',alignItems:'center',gap:4,padding:'4px 12px',background:'#f8f9fa',color:'var(--text)',border:'1px solid var(--border)',borderRadius:5,fontSize:12,fontWeight:500 },
  uploadRow: { display:'flex',alignItems:'center',gap:8 },
  uploadBtn: { display:'flex',alignItems:'center',gap:5,padding:'7px 12px',background:'#f8f9fa',color:'var(--text)',border:'1.5px solid var(--border)',borderRadius:6,fontSize:12,fontWeight:500,flexShrink:0 },
  orDivider: { fontSize:11,color:'var(--text-light)',flexShrink:0 },
  clearBtn: { padding:'4px 8px',background:'#fee2e2',color:'#ef4444',border:'1px solid #fecaca',borderRadius:5,fontSize:12,flexShrink:0 },
  mediaPreview: { width:'100%',maxHeight:140,objectFit:'cover',borderRadius:6,marginTop:8,border:'1px solid var(--border)' },
  commentList: { display:'flex',flexDirection:'column',gap:7,marginBottom:10 },
  comment: { display:'flex',gap:8,alignItems:'flex-start',padding:'8px 10px',background:'var(--bg)',borderRadius:7,border:'1px solid var(--border)' },
  commentAvatar: { width:26,height:26,borderRadius:'50%',color:'#fff',fontSize:10,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 },
  commentBody: { flex:1,minWidth:0 },
  commentMeta: { display:'flex',alignItems:'center',gap:8,marginBottom:2 },
  commentAuthorName: { fontSize:11,fontWeight:700,color:'var(--text)' },
  commentTime: { fontSize:10,color:'var(--text-light)' },
  commentText: { fontSize:12,color:'var(--text)',lineHeight:1.5 },
  commentDeleteBtn: { width:18,height:18,borderRadius:4,background:'transparent',color:'var(--text-light)',fontSize:10,display:'flex',alignItems:'center',justifyContent:'center',border:'none',cursor:'pointer',flexShrink:0 },
  commentForm: { display:'flex',flexDirection:'column',gap:7 },
  commentAuthorRow: { display:'flex',alignItems:'center',gap:8 },
  commentAvatarBtn: { width:26,height:26,borderRadius:'50%',color:'#fff',fontSize:10,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',border:'none',cursor:'pointer',flexShrink:0,transition:'box-shadow 0.1s' },
  commentingAs: { fontSize:11,color:'var(--text-light)' },
  commentInputRow: { display:'flex',gap:8 },
  commentSubmit: { padding:'0 14px',height:38,background:'var(--navy)',color:'#fff',borderRadius:6,fontWeight:600,fontSize:12,flexShrink:0 },
  previewLabel: { fontSize:10,fontWeight:700,color:'var(--crimson)',textTransform:'uppercase',letterSpacing:'0.08em',padding:'14px 14px 8px' },
  previewCard: { margin:'0 12px',border:'1px solid var(--border)',borderRadius:8,overflow:'hidden' },
  previewHeader: { display:'flex',alignItems:'center',gap:8,padding:'10px 12px',background:'#f9fafb',borderBottom:'1px solid var(--border)' },
  previewAvatar: { width:30,height:30,borderRadius:'50%',background:'var(--crimson)',color:'#fff',fontSize:13,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 },
  previewName: { fontSize:12,fontWeight:600 },
  previewMeta: { fontSize:10,color:'var(--text-light)' },
  previewBody: { padding:'10px 12px',fontSize:11.5,lineHeight:1.7,color:'var(--text)',whiteSpace:'pre-wrap',maxHeight:200,overflowY:'auto' },
  suggestions: { padding:'12px 14px',borderBottom:'1px solid var(--border)' },
  suggestTitle: { fontSize:10,fontWeight:700,color:'var(--crimson)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:7 },
  chip: { display:'block',padding:'5px 10px',background:'var(--crimson-light)',color:'var(--crimson)',borderRadius:6,fontSize:11,fontWeight:500,textDecoration:'none',marginBottom:4,border:'1px solid var(--crimson-border)' },
  timeBox: { display:'flex',alignItems:'flex-start',gap:8,padding:'10px 14px',background:'#fffbeb',borderBottom:'1px solid #fef3c7' },
  timeIcon: { fontSize:15,flexShrink:0,marginTop:2 },
  timeLabel: { fontSize:9,fontWeight:700,color:'#92400e',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:2 },
  timeVal: { fontSize:11,color:'#78350f' },
  syncBox: { padding:'12px 14px' },
  syncedBadge: { fontSize:11,color:'#16a34a',fontWeight:600,marginBottom:6 },
  syncBtn: { display:'flex',alignItems:'center',justifyContent:'center',gap:5,width:'100%',padding:'7px 0',background:'#f0fdf4',color:'#16a34a',border:'1px solid #86efac',borderRadius:6,fontWeight:500,fontSize:12 },
  footer: { display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 20px',borderTop:'1px solid var(--border)',background:'#fafafa',flexShrink:0 },
  footerLeft: { display:'flex',gap:8 },
  footerRight: { display:'flex',gap:8 },
  btnPrimary: { display:'flex',alignItems:'center',gap:6,padding:'8px 20px',background:'var(--crimson)',color:'#fff',borderRadius:7,fontWeight:700,fontSize:13 },
  btnGhost: { display:'flex',alignItems:'center',gap:5,padding:'8px 14px',background:'transparent',color:'var(--text-muted)',border:'1.5px solid var(--border)',borderRadius:7,fontWeight:500,fontSize:13 },
  btnDanger: { padding:'8px 14px',background:'#fef2f2',color:'#ef4444',border:'1px solid #fecaca',borderRadius:7,fontWeight:500,fontSize:13 },
}
