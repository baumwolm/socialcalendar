import axios from 'axios';

const api = axios.create({ baseURL: '/api', withCredentials: true });

// Posts
export const getPosts = (params = {}) => api.get('/posts', { params }).then(r => r.data);
export const getPost = (id) => api.get(`/posts/${id}`).then(r => r.data);
export const createPost = (data) => api.post('/posts', data).then(r => r.data);
export const updatePost = (id, data) => api.patch(`/posts/${id}`, data).then(r => r.data);
export const deletePost = (id) => api.delete(`/posts/${id}`).then(r => r.data);

// AI Generation
export const generateDraft = (data) => api.post('/generate', data).then(r => r.data);
export const refineCopy = (copy, instruction) => api.post('/refine', { copy, instruction }).then(r => r.data);

// Media upload
export const uploadMedia = (file) => {
  const form = new FormData();
  form.append('file', file);
  return api.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
};

// Brand voice examples
export const getExamples = (type) => api.get('/examples', { params: type ? { type } : {} }).then(r => r.data);
export const createExample = (data) => api.post('/examples', data).then(r => r.data);
export const deleteExample = (id) => api.delete(`/examples/${id}`).then(r => r.data);

// Comments
export const getComments    = (postId)       => api.get(`/posts/${postId}/comments`).then(r => r.data);
export const createComment  = (postId, data) => api.post(`/posts/${postId}/comments`, data).then(r => r.data);
export const deleteComment  = (postId, id)   => api.delete(`/posts/${postId}/comments/${id}`).then(r => r.data);

// LinkedIn scrape
export const scrapeUrl = (url) => api.post('/scrape', { url }).then(r => r.data);

// Auth
export const getAuthStatus = () => api.get('/auth/status').then(r => r.data);
export const googleLogout = () => api.post('/auth/logout').then(r => r.data);

// Calendar sync
export const syncToCalendar = (postId) => api.post('/calendar/sync', { postId }).then(r => r.data);
