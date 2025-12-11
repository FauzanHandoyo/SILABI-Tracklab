import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to every request
api.interceptors.request.use(
  async (config) => {
    // Try regular JWT first
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // If no JWT, try Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
        console.log('Using Supabase token for request');
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors (token expired/invalid)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const token = localStorage.getItem('token');
      const { data: { session } } = await supabase.auth.getSession();
      
      // Only logout if BOTH tokens are invalid
      if (!token && !session) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        await supabase.auth.signOut();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const userAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  getCurrentUser: () => api.get('/users/me'),
  updateCurrentUser: (data) => api.put('/users/me', data),
  changePassword: (data) => api.put('/users/me/change-password', data),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`)
};

export const assetAPI = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.category) params.append('category', filters.category);
    if (filters.location) params.append('location', filters.location);
    return api.get(`/aset?${params.toString()}`);
  },
  getById: (id) => api.get(`/aset/${id}`),
  create: (data) => api.post('/aset', data),
  update: (id, data) => api.put(`/aset/${id}`, data),
  delete: (id) => api.delete(`/aset/${id}`),
  getStats: () => api.get('/aset/stats')
};

export const requestAPI = {
  getAll: () => api.get('/requests'),
  getById: (id) => api.get(`/requests/${id}`),
  create: (data) => api.post('/requests', data),
  update: (id, data) => api.put(`/requests/${id}`, data),
  delete: (id) => api.delete(`/requests/${id}`),

  createRequest: (data) => api.post('/requests', data),
  approveRequest: (id) => api.put(`/requests/${id}/approve`),
  denyRequest: (id) => api.put(`/requests/${id}/deny`)
};

export const historyAPI = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.asset_id) params.append('asset_id', filters.asset_id);
    if (filters.days) params.append('days', filters.days);
    if (filters.event_type) params.append('event_type', filters.event_type);
    if (filters.limit) params.append('limit', filters.limit);
    return api.get(`/history?${params.toString()}`);
  },
  getById: (id) => api.get(`/history/${id}`),
  getByAssetId: (assetId, limit) => api.get(`/history/asset/${assetId}?limit=${limit || 50}`),
  create: (data) => api.post('/history', data)
};

export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`)
};

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: async (data) => {
    const response = await api.post('/auth/login', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response;
  },
  logout: async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    await supabase.auth.signOut();
    window.location.href = '/login';
  },
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  getToken: () => {
    return localStorage.getItem('token');
  },
  verifyToken: () => api.get('/auth/verify')
};

export default api;