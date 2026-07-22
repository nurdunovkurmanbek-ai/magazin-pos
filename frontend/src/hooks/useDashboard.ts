import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import type { ApiResponse, DashboardStats, DashboardCharts } from '@magazin/shared';

interface UseFetchResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

function useFetch<T>(url: string): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: res } = await api.get<ApiResponse<T>>(url);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError('loadError');
      }
    } catch {
      setError('loadError');
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

export function useDashboardStats() {
  return useFetch<DashboardStats>('/dashboard/stats');
}

export function useDashboardCharts() {
  return useFetch<DashboardCharts>('/dashboard/charts');
}
