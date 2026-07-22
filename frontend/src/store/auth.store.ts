import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile, AuthTokens } from '@magazin/shared';
import api from '@/lib/api';
import type { ApiResponse } from '@magazin/shared';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  message: string | null;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  clearSession: () => void;
  forgotPassword: (email: string) => Promise<string | undefined>;
  resetPassword: (token: string, password: string, confirmPassword: string) => Promise<void>;
  clearError: () => void;
  clearMessage: () => void;
}

function wipeTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      message: null,

      clearSession: () => {
        wipeTokens();
        set({ user: null, isAuthenticated: false, isLoading: false, error: null });
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post<
            ApiResponse<{ user: UserProfile; tokens: AuthTokens }>
          >('/auth/login', { email: email.trim().toLowerCase(), password });

          if (data.success && data.data) {
            localStorage.setItem('accessToken', data.data.tokens.accessToken);
            localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
            set({
              user: data.data.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return;
          }

          set({ error: data.message || 'loginError', isLoading: false });
          throw new Error('Login failed');
        } catch (err) {
          const axiosErr = err as {
            response?: { data?: ApiResponse };
            code?: string;
            message?: string;
          };
          let msg = axiosErr.response?.data?.message;

          if (!msg) {
            if (axiosErr.code === 'ERR_NETWORK' || axiosErr.message?.includes('Network Error')) {
              msg = 'serverUnavailable';
            } else {
              msg = 'loginError';
            }
          }

          set({ error: msg, isLoading: false });
          throw new Error('Login failed');
        }
      },

      logout: async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        try {
          if (refreshToken) {
            await api.post('/auth/logout', { refreshToken });
          }
        } finally {
          wipeTokens();
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      fetchMe: async () => {
        set({ isLoading: true });
        try {
          const { data } = await api.get<ApiResponse<UserProfile>>('/auth/me');
          if (data.success && data.data) {
            set({ user: data.data, isAuthenticated: true, isLoading: false });
            return;
          }
          wipeTokens();
          set({ user: null, isAuthenticated: false, isLoading: false });
        } catch {
          wipeTokens();
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      forgotPassword: async (email) => {
        set({ isLoading: true, error: null, message: null });
        try {
          const { data } = await api.post<
            ApiResponse<{ message: string; resetToken?: string }>
          >('/auth/forgot-password', { email });

          set({ isLoading: false, message: 'forgotPasswordSent' });
          return data.data?.resetToken;
        } catch {
          set({ error: 'forgotPasswordError', isLoading: false });
          throw new Error('Forgot password failed');
        }
      },

      resetPassword: async (token, password, confirmPassword) => {
        set({ isLoading: true, error: null });
        try {
          await api.post('/auth/reset-password', { token, password, confirmPassword });
          set({ isLoading: false, message: 'resetPasswordSuccess' });
        } catch {
          set({ error: 'resetPasswordError', isLoading: false });
          throw new Error('Reset password failed');
        }
      },

      clearError: () => set({ error: null }),
      clearMessage: () => set({ message: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
