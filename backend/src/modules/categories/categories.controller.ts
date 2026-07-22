import { Request, Response, NextFunction } from 'express';
import { CategoriesService, CategoryError } from './categories.service';
import { categorySchema, categoryIdSchema } from './categories.schema';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/api-response';

export class CategoriesController {
  /** GET /categories */
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const data = await CategoriesService.findAll(includeInactive);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  /** GET /categories/:id */
  static async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = categoryIdSchema.parse(req.params);
      const data = await CategoriesService.findById(id);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  /** POST /categories */
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = categorySchema.parse(req.body);
      const data = await CategoriesService.create(input);
      sendCreated(res, data, 'Категория түзүлдү');
    } catch (error) {
      next(error);
    }
  }

  /** PUT /categories/:id */
  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = categoryIdSchema.parse(req.params);
      const input = categorySchema.parse(req.body);
      const data = await CategoriesService.update(id, input);
      sendSuccess(res, data, 'Категория жаңыланды');
    } catch (error) {
      next(error);
    }
  }

  /** DELETE /categories/:id */
  static async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = categoryIdSchema.parse(req.params);
      await CategoriesService.delete(id);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }
}

/** Категория каталарын иштетүү */
export function handleCategoryError(
  error: Error,
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  if (error instanceof CategoryError) {
    res.status(error.statusCode).json({ success: false, message: error.message });
    return;
  }
  next(error);
}
