import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type {
  ApiResponse,
  FinancialReport,
  Expense,
  ExpenseInput,
  ReportPeriod,
  PaginatedResponse,
  SalesReport,
  ProductsReport,
  EmployeesReport,
} from '@magazin/shared';

export type ReportTab = 'sales' | 'products' | 'employees' | 'finance';

export function useReports() {
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [productsReport, setProductsReport] = useState<ProductsReport | null>(null);
  const [employeesReport, setEmployeesReport] = useState<EmployeesReport | null>(null);
  const [financeReport, setFinanceReport] = useState<FinancialReport | null>(null);
  const [expenses, setExpenses] = useState<PaginatedResponse<Expense> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<ReportPeriod>('daily');
  const [refDate, setRefDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState<ReportTab>('sales');

  const params = { period, date: refDate };

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [salesRes, productsRes, employeesRes, financeRes] = await Promise.all([
        api.get<ApiResponse<SalesReport>>('/reports/sales', { params }),
        api.get<ApiResponse<ProductsReport>>('/reports/products', { params }),
        api.get<ApiResponse<EmployeesReport>>('/reports/employees', { params }),
        api.get<ApiResponse<FinancialReport>>('/finance/report', { params }),
      ]);
      if (salesRes.data.success && salesRes.data.data) setSalesReport(salesRes.data.data);
      if (productsRes.data.success && productsRes.data.data) setProductsReport(productsRes.data.data);
      if (employeesRes.data.success && employeesRes.data.data) setEmployeesReport(employeesRes.data.data);
      if (financeRes.data.success && financeRes.data.data) setFinanceReport(financeRes.data.data);
    } catch {
      setError('loadError');
    } finally {
      setIsLoading(false);
    }
  }, [period, refDate]);

  const fetchExpenses = useCallback(async () => {
    if (!financeReport) return;
    try {
      const dateFrom = financeReport.dateFrom.split('T')[0];
      const dateTo = new Date(financeReport.dateTo);
      dateTo.setDate(dateTo.getDate() - 1);
      const { data: res } = await api.get<ApiResponse<PaginatedResponse<Expense>>>('/finance/expenses', {
        params: { dateFrom, dateTo: dateTo.toISOString().split('T')[0], limit: 50 },
      });
      if (res.success && res.data) setExpenses(res.data);
    } catch {
      /* optional */
    }
  }, [financeReport]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const createExpense = async (input: ExpenseInput) => {
    const { data: res } = await api.post<ApiResponse<Expense>>('/finance/expenses', input);
    if (!res.success) throw new Error(res.message);
    await fetchAll();
    await fetchExpenses();
    return res.data!;
  };

  const updateExpense = async (id: string, input: ExpenseInput) => {
    const { data: res } = await api.put<ApiResponse<Expense>>(`/finance/expenses/${id}`, input);
    if (!res.success) throw new Error(res.message);
    await fetchAll();
    await fetchExpenses();
    return res.data!;
  };

  const deleteExpense = async (id: string) => {
    await api.delete(`/finance/expenses/${id}`);
    await fetchAll();
    await fetchExpenses();
  };

  return {
    salesReport,
    productsReport,
    employeesReport,
    financeReport,
    expenses,
    isLoading,
    error,
    period,
    setPeriod,
    refDate,
    setRefDate,
    activeTab,
    setActiveTab,
    refetch: fetchAll,
    createExpense,
    updateExpense,
    deleteExpense,
  };
}
