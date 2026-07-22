import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { ApiResponse, Product, ProductInput, PaginatedResponse } from '@magazin/shared';

interface ProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  lowStock?: boolean;
}

export function useProducts(initialQuery: ProductQuery = {}) {
  const [data, setData] = useState<PaginatedResponse<Product> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState(initialQuery);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: res } = await api.get<ApiResponse<PaginatedResponse<Product>>>('/products', {
        params: { ...query, includeInactive: true },
      });
      if (res.success && res.data) setData(res.data);
    } catch {
      setError('loadError');
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const createProduct = async (input: ProductInput) => {
    const { data: res } = await api.post<ApiResponse<Product>>('/products', input);
    if (!res.success) throw new Error(res.message);
    await fetchProducts();
    return res.data!;
  };

  const updateProduct = async (id: string, input: ProductInput) => {
    const { data: res } = await api.put<ApiResponse<Product>>(`/products/${id}`, input);
    if (!res.success) throw new Error(res.message);
    await fetchProducts();
    return res.data!;
  };

  const deleteProduct = async (id: string) => {
    await api.delete(`/products/${id}`);
    await fetchProducts();
  };

  const uploadImage = async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const { data: res } = await api.post<ApiResponse<Product>>(
      `/products/${id}/image`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    if (!res.success) throw new Error(res.message);
    await fetchProducts();
  };

  return {
    products: data?.items ?? [],
    pagination: data,
    isLoading,
    error,
    query,
    setQuery,
    refetch: fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    uploadImage,
  };
}
