import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type {
  ApiResponse,
  FinancialReport,
  Expense,
  ExpenseInput,
  ReportPeriod,
  PaginatedResponse,
} from '@magazin/shared';

export function useFinance() {
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [expenses, setExpenses] = useState<PaginatedResponse<Expense> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<ReportPeriod>('daily');
  const [refDate, setRefDate] = useState(() => new Date().toISOString().split('T')[0]);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: res } = await api.get<ApiResponse<FinancialReport>>('/finance/report', {
        params: { period, date: refDate },
      });
      if (res.success && res.data) setReport(res.data);
    } catch {
      setError('loadError');
    } finally {
      setIsLoading(false);
    }
  }, [period, refDate]);

  const fetchExpenses = useCallback(async () => {
    if (!report) return;
    try {
      const dateFrom = report.dateFrom.split('T')[0];
      const dateTo = new Date(report.dateTo);
      dateTo.setDate(dateTo.getDate() - 1);
      const { data: res } = await api.get<ApiResponse<PaginatedResponse<Expense>>>('/finance/expenses', {
        params: { dateFrom, dateTo: dateTo.toISOString().split('T')[0], limit: 50 },
      });
      if (res.success && res.data) setExpenses(res.data);
    } catch {
      /* optional */
    }
  }, [report]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const createExpense = async (input: ExpenseInput) => {
    const { data: res } = await api.post<ApiResponse<Expense>>('/finance/expenses', input);
    if (!res.success) throw new Error(res.message);
    await fetchReport();
    await fetchExpenses();
    return res.data!;
  };

  const updateExpense = async (id: string, input: ExpenseInput) => {
    const { data: res } = await api.put<ApiResponse<Expense>>(`/finance/expenses/${id}`, input);
    if (!res.success) throw new Error(res.message);
    await fetchReport();
    await fetchExpenses();
    return res.data!;
  };

  const deleteExpense = async (id: string) => {
    await api.delete(`/finance/expenses/${id}`);
    await fetchReport();
    await fetchExpenses();
  };

  return {
    report,
    expenses,
    isLoading,
    error,
    period,
    setPeriod,
    refDate,
    setRefDate,
    refetch: fetchReport,
    createExpense,
    updateExpense,
    deleteExpense,
  };
}
