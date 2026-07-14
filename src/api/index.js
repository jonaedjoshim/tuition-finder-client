import axios from 'axios';
import { auth } from '../firebase/config';

// Base URL comes from the frontend .env file: VITE_API_URL=http://localhost:5000/api
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach a fresh Firebase ID token (if a user is signed in) to every outgoing request
api.interceptors.request.use(async (config) => {
  const currentUser = auth.currentUser;
  if (currentUser) {
    const token = await currentUser.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Globally handle expired/invalid tokens (401) by sending the user to login.
// Firebase's own onAuthStateChanged (in AuthContext) handles clearing local state.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ===== AUTH =====
// NOTE: login/logout/password-change happen client-side via Firebase (see AuthContext.jsx).
// register here only creates the matching MongoDB user after the Firebase account exists.
export const authAPI = {
  register: (data) => api.post('/auth/register', data), // { name, phone, role, idToken }
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// ===== TUTORS =====
export const tutorAPI = {
  getAll: (params) => api.get('/tutors', { params }),
  getById: (id) => api.get(`/tutors/${id}`),
  updateProfile: (data) => api.put('/tutors/profile', data),
  uploadDocuments: (formData) =>
    api.post('/tutors/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getApplications: (params) => api.get('/tutors/applications', { params }),
  getHistory: (params) => api.get('/tutors/history', { params }),
};

// ===== TUITION POSTS =====
export const postAPI = {
  create: (data) => api.post('/posts', data),
  getAll: (params) => api.get('/posts', { params }),
  getById: (id) => api.get(`/posts/${id}`),
  getMine: (params) => api.get('/posts/mine', { params }),
  update: (id, data) => api.put(`/posts/${id}`, data),
  delete: (id) => api.delete(`/posts/${id}`),
  apply: (postId, data) => api.post(`/posts/${postId}/apply`, data),
  getApplicationsForPost: (postId, params) =>
    api.get(`/posts/${postId}/applications`, { params }),
};

// ===== APPLICATIONS =====
export const applicationAPI = {
  updateStatus: (id, status) => api.put(`/applications/${id}`, { status }),
  getMyReceived: (params) => api.get('/applications/mine', { params }),
};

// ===== REVIEWS =====
export const reviewAPI = {
  add: (tutorId, data) => api.post(`/tutors/${tutorId}/reviews`, data),
  getForTutor: (tutorId, params) => api.get(`/tutors/${tutorId}/reviews`, { params }),
};

// ===== MESSAGES =====
export const messageAPI = {
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (userId, params) => api.get(`/messages/${userId}`, { params }),
  send: (data) => api.post('/messages', data),
};

// ===== ADMIN =====
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserStatus: (id, status) => api.put(`/admin/users/${id}`, { status }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getPosts: (params) => api.get('/admin/posts', { params }),
  approvePost: (id) => api.put(`/admin/posts/${id}/approve`),
  rejectPost: (id) => api.put(`/admin/posts/${id}/reject`),
  getReports: (params) => api.get('/admin/reports', { params }),
  resolveReport: (id) => api.put(`/admin/reports/${id}/resolve`),
  verifyTutor: (id) => api.put(`/admin/tutors/${id}/verify`),
};

export default api;
