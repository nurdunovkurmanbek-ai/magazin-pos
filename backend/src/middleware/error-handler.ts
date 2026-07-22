import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/api-response';
import { AuthError } from '../modules/auth/auth.service';
import { CategoryError } from '../modules/categories/categories.service';
import { ProductError } from '../modules/products/products.service';
import { InventoryError } from '../modules/inventory/inventory.service';
import { SaleError } from '../modules/sales/sales.service';
import { StockError } from '../modules/stock/stock.service';
import { PublicError } from '../modules/public/public.service';
import { FinanceError } from '../modules/finance/finance.service';
import { SettingsError } from '../modules/settings/settings.service';
import { BackupError } from '../modules/backup/backup.service';
import { env } from '../config/env';

/**
 * Глобалдык каталарды иштетүү middleware
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Zod валидация каталары
  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    err.errors.forEach((e) => {
      const field = e.path.join('.');
      if (!errors[field]) errors[field] = [];
      errors[field].push(e.message);
    });
    sendError(res, 'Валидация катасы', 422, errors);
    return;
  }

  // Аутентификация каталары
  if (err instanceof AuthError) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  if (err instanceof CategoryError) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  if (err instanceof ProductError) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  if (err instanceof InventoryError) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  if (err instanceof SaleError) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  if (err instanceof StockError) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  if (err instanceof PublicError) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  if (err instanceof FinanceError) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  if (err instanceof SettingsError) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  if (err instanceof BackupError) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  // Белгисиз каталар
  console.error('[ERROR]', err);

  const message = env.isDev ? err.message : 'Ички сервер катасы';
  sendError(res, message, 500);
}

/**
 * 404 — маршрут табылган жок
 */
export function notFoundHandler(_req: Request, res: Response): void {
  sendError(res, 'Маршрут табылган жок', 404);
}
