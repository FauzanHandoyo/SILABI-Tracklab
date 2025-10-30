// src/utils/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export const userAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`)
};

export const assetAPI = {
  getAll: () => api.get('/aset'),
  getById: (id) => api.get(`/aset/${id}`),
  create: (data) => api.post('/aset', data),
  update: (id, data) => api.put(`/aset/${id}`, data),
  delete: (id) => api.delete(`/aset/${id}`)
};

export default api;