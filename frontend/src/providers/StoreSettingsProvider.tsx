import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import api from '@/lib/api';
import type { ApiResponse, StoreSettings, StoreSettingsInput } from '@magazin/shared';
import { useAuthStore } from '@/store/auth.store';

interface StoreSettingsContextValue {
  settings: StoreSettings | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
  updateSettings: (input: StoreSettingsInput) => Promise<StoreSettings>;
  uploadLogo: (file: File) => Promise<StoreSettings>;
  removeLogo: () => Promise<StoreSettings>;
}

const StoreSettingsContext = createContext<StoreSettingsContextValue | null>(null);

export function StoreSettingsProvider({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSettings = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!isAuthenticated || !token) return;
    setIsLoading(true);
    try {
      const { data: res } = await api.get<ApiResponse<StoreSettings>>('/settings');
      if (res.success && res.data) setSettings(res.data);
    } catch {
      /* optional */
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (input: StoreSettingsInput) => {
    const { data: res } = await api.put<ApiResponse<StoreSettings>>('/settings', input);
    if (!res.success || !res.data) throw new Error(res.message);
    setSettings(res.data);
    return res.data;
  };

  const uploadLogo = async (file: File) => {
    const form = new FormData();
    form.append('logo', file);
    const { data: res } = await api.post<ApiResponse<StoreSettings>>('/settings/logo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (!res.success || !res.data) throw new Error(res.message);
    setSettings(res.data);
    return res.data;
  };

  const removeLogo = async () => {
    const { data: res } = await api.delete<ApiResponse<StoreSettings>>('/settings/logo');
    if (!res.success || !res.data) throw new Error(res.message);
    setSettings(res.data);
    return res.data;
  };

  return (
    <StoreSettingsContext.Provider
      value={{ settings, isLoading, refetch: fetchSettings, updateSettings, uploadLogo, removeLogo }}
    >
      {children}
    </StoreSettingsContext.Provider>
  );
}

export function useStoreSettings() {
  const ctx = useContext(StoreSettingsContext);
  if (!ctx) throw new Error('useStoreSettings must be used within StoreSettingsProvider');
  return ctx;
}
