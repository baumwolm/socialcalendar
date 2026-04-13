import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import TopNav from './components/TopNav'
import Sidebar from './components/Sidebar'
import CalendarGrid from './components/CalendarGrid'
import PostModal from './components/PostModal'
import PromptBar from './components/PromptBar'
import BrandVoice from './components/BrandVoice'
import { getPosts, getAuthStatus } from './utils/api'

export default function App() {
  const [currentDate,    setCurrentDate]    = useState(new Date())
  const [selectedPost,   setSelectedPost]   = useState(null)
  const [draft,          setDraft]          = useState(null)
  const [modalOpen,      setModalOpen]      = useState(false)
  const [modalDate,      setModalDate]      = useState(null)
  const [activeFilter,   setActiveFilter]   = useState(null)
  const [brandVoiceOpen, setBrandVoiceOpen] = useState(false)

  const queryClient = useQueryClient()

  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['posts', activeFilter],
    queryFn: () => getPosts(activeFilter ? { type: activeFilter } : {})
  })

  const { data: authStatus } = useQuery({
    queryKey: ['authStatus'],
    queryFn: getAuthStatus,
    retry: false
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('google_auth') === 'success') {
      toast.success('Google Calendar connected!')
      queryClient.invalidateQueries({ queryKey: ['authStatus'] })
      window.history.replaceState({}, '', '/')
    }
  }, [])

  function openNewPost(date) {
    setSelectedPost(null); setDraft(null)
    setModalDate(date); setModalOpen(true)
  }

  function openExistingPost(post) {
    setSelectedPost(post); setDraft(null)
    setModalDate(null); setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false); setSelectedPost(null)
    setDraft(null); setModalDate(null)
  }

  function onDraftGenerated(draftData, date, postType) {
    setDraft({ ...draftData, date, postType })
    setSelectedPost(null); setModalDate(date); setModalOpen(true)
  }

  return (
    <div style={s.root}>
      {/* Top nav */}
      <TopNav onOpenBrandVoice={() => setBrandVoiceOpen(true)} />

      {/* Content row */}
      <div style={s.content}>
        <Sidebar
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          authStatus={authStatus}
          posts={posts}
        />
        <main style={s.main}>
          <CalendarGrid
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
            posts={posts}
            loading={postsLoading}
            onDayClick={openNewPost}
            onPostClick={openExistingPost}
          />
        </main>
      </div>

      {/* Prompt bar */}
      <PromptBar onDraftGenerated={onDraftGenerated} />

      {/* Modals */}
      {brandVoiceOpen && <BrandVoice onClose={() => setBrandVoiceOpen(false)} />}

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

const s = {
  root: {
    display: 'flex', flexDirection: 'column',
    height: '100vh', overflow: 'hidden',
  },
  content: {
    display: 'flex', flex: 1, overflow: 'hidden',
  },
  main: {
    flex: 1, overflow: 'hidden',
    display: 'flex', flexDirection: 'column',
  },
}
