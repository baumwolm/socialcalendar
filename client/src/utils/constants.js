export const POST_TYPES = [
  { label: 'Customer Launch',            color: '#22c55e', bg: '#dcfce7', border: '#86efac' },
  { label: 'Case Study',                 color: '#3b82f6', bg: '#dbeafe', border: '#93c5fd' },
  { label: 'New Product',                color: '#a855f7', bg: '#f3e8ff', border: '#d8b4fe' },
  { label: 'Employee Shoutout',          color: '#f59e0b', bg: '#fef3c7', border: '#fcd34d' },
  { label: 'GovTech Thought Leadership', color: '#f97316', bg: '#ffedd5', border: '#fdba74' },
  { label: 'Conference Recap',           color: '#ef4444', bg: '#fee2e2', border: '#fca5a5' },
];

export const POST_TYPE_MAP = Object.fromEntries(POST_TYPES.map(t => [t.label, t]));

export const STATUSES = ['draft', 'scheduled', 'published'];

export const STATUS_LABELS = {
  draft:     { label: 'Draft',     color: '#6b7280', bg: '#f3f4f6' },
  scheduled: { label: 'Scheduled', color: '#3b82f6', bg: '#dbeafe' },
  published: { label: 'Published', color: '#22c55e', bg: '#dcfce7' },
};
