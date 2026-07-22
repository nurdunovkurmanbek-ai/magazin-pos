import type { ReportPeriod } from './finance';
import type { PaymentChartPoint } from './dashboard';

/** Сатуу отчёту — жыйынтык */
export interface SalesReportSummary {
  salesCount: number;
  revenue: number;
  discounts: number;
  avgTicket: number;
  itemsSold: number;
}

/** Сатуу отчёту — мезгил боюнча пункт */
export interface SalesBreakdownPoint {
  key: string;
  label: string;
  salesCount: number;
  revenue: number;
  avgTicket: number;
}

/** Сатуу отчёту */
export interface SalesReport {
  period: ReportPeriod;
  dateFrom: string;
  dateTo: string;
  summary: SalesReportSummary;
  breakdown: SalesBreakdownPoint[];
  byPaymentMethod: PaymentChartPoint[];
}

/** Товар рейтинги */
export interface ProductRankingItem {
  productId: string;
  nameKy: string;
  nameRu: string;
  quantitySold: number;
  revenue: number;
  profit: number;
  salesCount: number;
}

/** Товарлар отчёту */
export interface ProductsReport {
  period: ReportPeriod;
  dateFrom: string;
  dateTo: string;
  top: ProductRankingItem[];
  bottom: ProductRankingItem[];
}

/** Кызматкердин көрсөткүчтөрү */
export interface EmployeePerformance {
  userId: string;
  firstName: string;
  lastName: string;
  role: string;
  salesCount: number;
  revenue: number;
  avgTicket: number;
  itemsSold: number;
}

/** Кызматкерлер отчёту */
export interface EmployeesReport {
  period: ReportPeriod;
  dateFrom: string;
  dateTo: string;
  employees: EmployeePerformance[];
}
