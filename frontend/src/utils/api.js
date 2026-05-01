import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const AUTH_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/verify-email',
  '/auth/resend-otp',
  '/auth/refresh-token',
  '/auth/logout',
];

const isAuthRoute = (url = '') => AUTH_ROUTES.some((path) => url.includes(path));
const isAuthPage = () =>
  typeof window !== 'undefined' && ['/login', '/register'].includes(window.location.pathname);

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config || {};
    const status = error.response?.status;

    if (status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      const authRoute = isAuthRoute(original.url);

      if (authRoute) {
        return Promise.reject(error);
      }

      if (!refreshToken || original._retry) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (!isAuthPage()) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      original._retry = true;
      try {
        const { data } = await axios.post(`${API_BASE}/auth/refresh-token`, { refreshToken });
        const newToken = data.data.accessToken;

        localStorage.setItem('accessToken', newToken);
        original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` };
        return api(original);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (!isAuthPage()) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
