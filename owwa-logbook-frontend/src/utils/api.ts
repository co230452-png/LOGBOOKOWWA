import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('owwa_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 (token expired)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('owwa_token');
      localStorage.removeItem('owwa_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authAPI = {
  register: (data: object) => api.post('/auth/register', data),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
  regenerateQR: () => api.post('/auth/regenerate-qr'),
};

// ─── Users ───────────────────────────────────────────────────────────────────

export const usersAPI = {
  getAll: (params?: object) => api.get('/users', { params }),
  getPending: () => api.get('/users/pending'),
  getById: (id: string) => api.get(`/users/${id}`),
  updateStatus: (id: string, status: string) =>
    api.patch(`/users/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/users/${id}`),
  getStats: () => api.get('/users/stats'),
};

// ─── Attendance ──────────────────────────────────────────────────────────────

export const attendanceAPI = {
  log: (userId: string) => api.post('/attendance/log', { userId }),
  getAll: (params?: object) => api.get('/attendance', { params }),
  getToday: () => api.get('/attendance/today'),
  getMy: (params?: object) => api.get('/attendance/my', { params }),
  delete: (id: string) => api.delete(`/attendance/${id}`),
};

export default api;
