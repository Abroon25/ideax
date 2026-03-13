import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

// Always read fresh token for every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});

// Queue system to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !original._retry
    ) {
      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = 'Bearer ' + token;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(API_BASE + '/auth/refresh', { refreshToken });

        // Save new tokens
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);

        // ★ Also update this account's tokens in savedAccounts
        try {
          const saved = JSON.parse(localStorage.getItem('savedAccounts') || '[]');
          // Find which account this token belongs to by checking all entries
          const idx = saved.findIndex(a => a.refreshToken === refreshToken);
          if (idx >= 0) {
            saved[idx].accessToken = data.accessToken;
            saved[idx].refreshToken = data.refreshToken;
            localStorage.setItem('savedAccounts', JSON.stringify(saved));
          }
        } catch {} // non-critical

        processQueue(null, data.accessToken);

        original.headers.Authorization = 'Bearer ' + data.accessToken;
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);

        // ★ CRITICAL FIX: Only remove active tokens, NOT savedAccounts
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;