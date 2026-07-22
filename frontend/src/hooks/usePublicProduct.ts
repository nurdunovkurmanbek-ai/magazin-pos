import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { ApiResponse, ProductScanResult } from '@magazin/shared';

export function usePublicProduct(productId?: string) {
  const [data, setData] = useState<ProductScanResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = useCallback(async () => {
    if (!productId) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data: res } = await api.get<ApiResponse<ProductScanResult>>(
        `/public/products/${productId}`
      );
      if (res.success && res.data) setData(res.data);
      else setError('notFound');
    } catch {
      setError('notFound');
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  return { data, isLoading, error, refetch: fetchProduct };
}
