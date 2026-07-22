import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type {
  ApiResponse,
  StockMovement,
  StockAlert,
  InventoryCount,
  StockReceiptInput,
  StockWriteOffInput,
  InventoryCountItemInput,
  PaginatedResponse,
  ReceiptResult,
} from '@magazin/shared';

export function useInventory() {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [movements, setMovements] = useState<PaginatedResponse<StockMovement> | null>(null);
  const [counts, setCounts] = useState<PaginatedResponse<InventoryCount> | null>(null);
  const [activeCount, setActiveCount] = useState<InventoryCount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      const { data: res } = await api.get<ApiResponse<StockAlert[]>>('/inventory/alerts');
      if (res.success && res.data) setAlerts(res.data);
    } catch {
      setError('loadError');
    }
  }, []);

  const fetchMovements = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const { data: res } = await api.get<ApiResponse<PaginatedResponse<StockMovement>>>(
        '/inventory/movements',
        { params: { page, limit: 20 } }
      );
      if (res.success && res.data) setMovements(res.data);
    } catch {
      setError('loadError');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCounts = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const { data: res } = await api.get<ApiResponse<PaginatedResponse<InventoryCount>>>(
        '/inventory/counts',
        { params: { page, limit: 10 } }
      );
      if (res.success && res.data) setCounts(res.data);
    } catch {
      setError('loadError');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCount = async (id: string) => {
    const { data: res } = await api.get<ApiResponse<InventoryCount>>(`/inventory/counts/${id}`);
    if (!res.success) throw new Error(res.message);
    setActiveCount(res.data!);
    return res.data!;
  };

  const receipt = async (input: StockReceiptInput) => {
    const { data: res } = await api.post<ApiResponse<ReceiptResult>>('/inventory/receipt', input);
    if (!res.success) throw new Error(res.message);
    await fetchAlerts();
    await fetchMovements();
    return res.data!;
  };

  const writeOff = async (input: StockWriteOffInput) => {
    const { data: res } = await api.post<ApiResponse<StockMovement>>('/inventory/write-off', input);
    if (!res.success) throw new Error(res.message);
    await fetchAlerts();
    await fetchMovements();
    return res.data!;
  };

  const createCount = async (notes?: string, categoryId?: string) => {
    const { data: res } = await api.post<ApiResponse<InventoryCount>>('/inventory/counts', {
      notes,
      categoryId,
    });
    if (!res.success) throw new Error(res.message);
    await fetchCounts();
    setActiveCount(res.data!);
    return res.data!;
  };

  const updateCountItems = async (id: string, items: InventoryCountItemInput[]) => {
    const { data: res } = await api.put<ApiResponse<InventoryCount>>(
      `/inventory/counts/${id}/items`,
      { items }
    );
    if (!res.success) throw new Error(res.message);
    setActiveCount(res.data!);
    return res.data!;
  };

  const completeCount = async (id: string) => {
    const { data: res } = await api.post<ApiResponse<InventoryCount>>(
      `/inventory/counts/${id}/complete`
    );
    if (!res.success) throw new Error(res.message);
    await fetchCounts();
    await fetchAlerts();
    await fetchMovements();
    setActiveCount(null);
    return res.data!;
  };

  const cancelCount = async (id: string) => {
    await api.delete(`/inventory/counts/${id}`);
    await fetchCounts();
    if (activeCount?.id === id) setActiveCount(null);
  };

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return {
    alerts,
    movements,
    counts,
    activeCount,
    isLoading,
    error,
    fetchAlerts,
    fetchMovements,
    fetchCounts,
    fetchCount,
    receipt,
    writeOff,
    createCount,
    updateCountItems,
    completeCount,
    cancelCount,
    setActiveCount,
  };
}
