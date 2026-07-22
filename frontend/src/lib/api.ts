import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse, AuthTokens } from '@magazin/shared';

/** Dev: Vite proxy аркылуу; Prod: .env же default */
export const API_URL =
  import.meta.env.VITE_API_URL
  ?? (import.meta.env.DEV ? '/api/v1' : 'http://localhost:3001/api/v1');
/**
 * Axios HTTP клиенти — JWT токендер менен
 */
export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

/** Access токенди суроого кошуу */
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function clearAuthAndRedirect() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('auth-storage');
  if (!window.location.pathname.startsWith('/login')) {
    window.location.replace('/login');
  }
}

/** 401 катасында токенди жаңылоо */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const url = originalRequest?.url ?? '';
    const isAuthEndpoint =
      url.includes('/auth/login') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/forgot-password') ||
      url.includes('/auth/reset-password');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post<ApiResponse<AuthTokens>>(
            `${API_URL}/auth/refresh`,
            { refreshToken }
          );

          if (data.success && data.data) {
            localStorage.setItem('accessToken', data.data.accessToken);
            localStorage.setItem('refreshToken', data.data.refreshToken);
            originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
            return api(originalRequest);
          }
        } catch {
          clearAuthAndRedirect();
          return Promise.reject(error);
        }
      }

      clearAuthAndRedirect();
    }

    return Promise.reject(error);
  }
);

export default api;
