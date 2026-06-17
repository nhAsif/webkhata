import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global response error handler
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(err);
    }

    const message =
      err.response?.data?.error ||
      err.response?.data?.detail ||
      'Something went wrong';

    // Don't toast auth errors — login page handles them
    if (err.response?.status !== 401) {
      toast.error(message);
    }

    return Promise.reject(err);
  }
);

export default api;
