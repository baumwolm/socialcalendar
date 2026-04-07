import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Sidebar from './components/Sidebar'
import CalendarGrid from './components/CalendarGrid'
import RightPanel from './components/RightPanel'
import PostModal from './components/PostModal'
import PromptBar from './components/PromptBar'
import { getPosts, getAuthStatus } from './utils/api'

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedPost, setSelectedPost] = useState(null)     // post object being viewed/edited
  const [draft, setDraft] = useState(null)                   // freshly generated AI draft
  const [modalOpen, setModalOpen] = useState(false)
  const [modalDate, setModalDate] = useState(null)           // date clicked on calendar
  const [activeFilter, setActiveFilter] = useState(null)     // post type filter from sidebar

  const queryClient = useQueryClient()

  // Load all posts
  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['posts', activeFilter],
    queryFn: () => getPosts(activeFilter ? { type: activeFilter } : {})
  })

  // Auth status for Google Calendar
  const { data: authStatus } = useQuery({
    queryKey: ['authStatus'],
    queryFn: getAuthStatus,
    retry: false
  })

  // Handle Google auth redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('google_auth') === 'success') {
      toast.success('Google Calendar connected!')
      queryClient.invalidateQueries({ queryKey: ['authStatus'] })
      window.history.replaceState({}, '', '/')
    }
  }, [])

  function openNewPost(date) {
    setSelectedPost(null)
    setDraft(null)
    setModalDate(date)
    setModalOpen(true)
  }

  function openExistingPost(post) {
    setSelectedPost(post)
    setDraft(null)
    setModalDate(null)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setSelectedPost(null)
    setDraft(null)
    setModalDate(null)
  }

  function onDraftGenerated(draftData, date, postType) {
    setDraft({ ...draftData, date, postType })
    setSelectedPost(null)
    setModalDate(date)
    setModalOpen(true)
  }

  return (
    <div style={styles.layout}>
      {/* Left Sidebar */}
      <Sidebar
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        authStatus={authStatus}
        posts={posts}
      />

      {/* Main content */}
      <div style={styles.main}>
        <CalendarGrid
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          posts={posts}
          loading={postsLoading}
          onDayClick={openNewPost}
          onPostClick={openExistingPost}
        />
      </div>

      {/* Right panel — shows draft preview or selected post */}
      <RightPanel
        draft={draft}
        selectedPost={selectedPost}
        onSaveDraft={(data) => {
          setDraft(data)
          setModalOpen(true)
        }}
        onEditPost={openExistingPost}
      />

      {/* Always-visible prompt bar at bottom */}
      <PromptBar onDraftGenerated={onDraftGenerated} />

      {/* Post modal — new/edit */}
      {modalOpen && (
        <PostModal
          post={selectedPost}
          draft={draft}
          defaultDate={modalDate}
          onClose={closeModal}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['posts'] })
            closeModal()
          }}
          authStatus={authStatus}
        />
      )}
    </div>
  )
}

const styles = {
  layout: {
    display: 'grid',
    gridTemplateColumns: 'var(--sidebar-width) 1fr var(--panel-width)',
    gridTemplateRows: '1fr var(--bar-height)',
    height: '100vh',
    overflow: 'hidden',
  },
  main: {
    gridColumn: '2',
    gridRow: '1',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  }
}
