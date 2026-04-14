export const POST_TYPES = [
  {
    label: 'Product Update',
    color: '#3b82f6', bg: '#dbeafe', border: '#93c5fd',
    description: 'Explains what your product does and how it helps government teams solve specific problems.'
  },
  {
    label: 'Customer Stories',
    color: '#22c55e', bg: '#dcfce7', border: '#86efac',
    description: 'Highlights real municipalities using your product and the outcomes they\'re seeing.'
  },
  {
    label: 'Thought Leadership (Industry POV)',
    color: '#a855f7', bg: '#f3e8ff', border: '#d8b4fe',
    description: 'Shares perspectives, trends, and opinions on the future of government and technology.'
  },
  {
    label: 'Announcements (Product, Partnerships, Launches)',
    color: '#f97316', bg: '#ffedd5', border: '#fdba74',
    description: 'Communicates major updates like new customers, product releases, or partnerships.'
  },
  {
    label: 'Video Content (Demos + Real Gov Voices)',
    color: '#ef4444', bg: '#fee2e2', border: '#fca5a5',
    description: 'Uses short-form video to showcase the product and amplify authentic voices from government staff.'
  },
  {
    label: 'Platform Insights',
    color: '#6366f1', bg: '#e0e7ff', border: '#a5b4fc',
    description: 'Surfaces trends and patterns from user data to help governments understand resident needs.'
  },
  {
    label: "Rep'd Behind-the-Scenes",
    color: '#ec4899', bg: '#fce7f3', border: '#f9a8d4',
    description: 'Shows the people, events, and relationships behind the company to build trust and familiarity.'
  },
]

export const POST_TYPE_MAP = Object.fromEntries(POST_TYPES.map(t => [t.label, t]))

export const TEAM_MEMBERS = [
  { id: 'MF', name: 'Mark Friese',    initials: 'MF', color: '#3b82f6' },
  { id: 'DH', name: 'Dior Hightower', initials: 'DH', color: '#8b5cf6' },
  { id: 'MB', name: 'Mike Baumwoll',  initials: 'MB', color: '#c41952' },
]
export const TEAM_MEMBER_MAP = Object.fromEntries(TEAM_MEMBERS.map(m => [m.id, m]))

export const STATUSES = ['draft', 'scheduled', 'published']

export const STATUS_LABELS = {
  draft:     { label: 'Draft',     color: '#6b7280', bg: '#f3f4f6' },
  scheduled: { label: 'Scheduled', color: '#3b82f6', bg: '#dbeafe' },
  published: { label: 'Published', color: '#22c55e', bg: '#dcfce7' },
}
