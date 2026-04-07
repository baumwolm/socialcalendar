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

// Auth
export const getAuthStatus = () => api.get('/auth/status').then(r => r.data);
export const googleLogout = () => api.post('/auth/logout').then(r => r.data);

// Calendar sync
export const syncToCalendar = (postId) => api.post('/calendar/sync', { postId }).then(r => r.data);
