/** Dashboard статистика */
export interface DashboardStats {
  todaySalesCount: number;
  todayRevenue: number;
  todayProfit: number;
  todayExpenses: number;
  stockProductsCount: number;
  lowStockCount: number;
  lowStockProducts: LowStockProduct[];
  recentSales: DashboardRecentSale[];
  changes: DashboardChanges;
}

/** Өзгөрүү көрсөткүчтөрү (кечээ менен салыштыруу) */
export interface DashboardChanges {
  salesCount: number;
  revenue: number;
  profit: number;
}

/** Аз калган товар */
export interface LowStockProduct {
  id: string;
  nameKy: string;
  nameRu: string;
  stock: number;
  unit: string;
  minStock: number;
}

/** Акыркы сатуу */
export interface DashboardRecentSale {
  id: string;
  saleNumber: string;
  total: number;
  paymentMethod: string;
  status: string;
  cashierName: string;
  itemsCount: number;
  createdAt: string;
}

/** График маалыматы — күнүмдүк */
export interface DailyChartPoint {
  date: string;
  label: string;
  salesCount: number;
  revenue: number;
  profit: number;
  expenses: number;
}

/** Төлөм ыкмасы боюнча */
export interface PaymentChartPoint {
  method: string;
  label: string;
  value: number;
  count: number;
}

/** Dashboard графиктери */
export interface DashboardCharts {
  daily: DailyChartPoint[];
  payments: PaymentChartPoint[];
}
