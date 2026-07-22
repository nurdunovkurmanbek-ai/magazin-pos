import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { ApiResponse, BackupListResponse, BackupRecord } from '@magazin/shared';

export function useBackups() {
  const [data, setData] = useState<BackupListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchBackups = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: res } = await api.get<ApiResponse<BackupListResponse>>('/backups');
      if (res.success && res.data) setData(res.data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  const createBackup = async (): Promise<BackupRecord> => {
    setActionLoading(true);
    try {
      const { data: res } = await api.post<ApiResponse<BackupRecord>>('/backups');
      if (!res.success || !res.data) throw new Error(res.message);
      await fetchBackups();
      return res.data;
    } finally {
      setActionLoading(false);
    }
  };

  const restoreBackup = async (id: string) => {
    setActionLoading(true);
    try {
      const { data: res } = await api.post<ApiResponse<{ restored: boolean }>>(`/backups/${id}/restore`);
      if (!res.success) throw new Error(res.message);
      await fetchBackups();
    } finally {
      setActionLoading(false);
    }
  };

  const uploadRestore = async (file: File) => {
    setActionLoading(true);
    try {
      const form = new FormData();
      form.append('backup', file);
      const { data: res } = await api.post<ApiResponse<{ restored: boolean }>>('/backups/upload-restore', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (!res.success) throw new Error(res.message);
      await fetchBackups();
    } finally {
      setActionLoading(false);
    }
  };

  const deleteBackup = async (id: string) => {
    setActionLoading(true);
    try {
      await api.delete(`/backups/${id}`);
      await fetchBackups();
    } finally {
      setActionLoading(false);
    }
  };

  const downloadBackup = async (id: string, filename: string) => {
    const { data } = await api.get(`/backups/${id}/download`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return {
    backups: data?.items ?? [],
    stats: data?.stats ?? null,
    isLoading,
    actionLoading,
    createBackup,
    restoreBackup,
    uploadRestore,
    deleteBackup,
    downloadBackup,
    refetch: fetchBackups,
  };
}
