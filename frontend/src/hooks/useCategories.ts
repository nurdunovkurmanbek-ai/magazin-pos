import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { ApiResponse, Category, CategoryInput } from '@magazin/shared';

export function useCategories(includeInactive = true) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get<ApiResponse<Category[]>>('/categories', {
        params: { includeInactive },
      });
      if (data.success && data.data) {
        setCategories(data.data);
      }
    } catch {
      setError('loadError');
    } finally {
      setIsLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = async (input: CategoryInput) => {
    const { data } = await api.post<ApiResponse<Category>>('/categories', input);
    if (!data.success) throw new Error(data.message);
    await fetchCategories();
    return data.data!;
  };

  const updateCategory = async (id: string, input: CategoryInput) => {
    const { data } = await api.put<ApiResponse<Category>>(`/categories/${id}`, input);
    if (!data.success) throw new Error(data.message);
    await fetchCategories();
    return data.data!;
  };

  const deleteCategory = async (id: string) => {
    await api.delete(`/categories/${id}`);
    await fetchCategories();
  };

  return {
    categories,
    isLoading,
    error,
    refetch: fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}
