import axios from 'axios';

/**
 * In development:  VITE_API_URL is unset → baseURL = '/api' → proxied by Vite to localhost:5000
 * In production:   VITE_API_URL = 'https://cmes-server.onrender.com/api' → direct HTTPS call
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// On 401, redirect to login (skip if already on login page)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
