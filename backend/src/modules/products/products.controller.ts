import { Request, Response, NextFunction } from 'express';
import { ProductsService, ProductError } from './products.service';
import { productSchema, productIdSchema, productQuerySchema } from './products.schema';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/api-response';
import { env } from '../../config/env';

export class ProductsController {
  /** GET /products */
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = productQuerySchema.parse(req.query);
      const data = await ProductsService.findAll(query);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  /** GET /products/barcode-lookup/:code */
  static async lookupByBarcode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const code = decodeURIComponent(String(req.params.code ?? ''));
      const data = await ProductsService.lookupByBarcode(code);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  /** GET /products/code/:code */
  static async findByCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const code = decodeURIComponent(String(req.params.code ?? ''));
      const data = await ProductsService.findByCode(code);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  /** GET /products/:id */
  static async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = productIdSchema.parse(req.params);
      const data = await ProductsService.findById(id);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  /** POST /products */
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = productSchema.parse(req.body);
      const data = await ProductsService.create(input, req.user?.userId);
      sendCreated(res, data, 'Товар түзүлдү');
    } catch (error) {
      next(error);
    }
  }

  /** PUT /products/:id */
  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = productIdSchema.parse(req.params);
      const input = productSchema.parse(req.body);
      const data = await ProductsService.update(id, input, req.user?.userId);
      sendSuccess(res, data, 'Товар жаңыланды');
    } catch (error) {
      next(error);
    }
  }

  /** POST /products/:id/image */
  static async uploadImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = productIdSchema.parse(req.params);
      if (!req.file) {
        res.status(400).json({ success: false, message: 'Сүрөт файлы талап кылынат' });
        return;
      }
      const imageUrl = `/uploads/products/${req.file.filename}`;
      const baseUrl = env.isDev ? '' : '';
      const fullUrl = `${baseUrl}${imageUrl}`;
      const data = await ProductsService.updateImage(id, fullUrl);
      sendSuccess(res, data, 'Сүрөт жүктөлдү');
    } catch (error) {
      next(error);
    }
  }

  /** DELETE /products/:id */
  static async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = productIdSchema.parse(req.params);
      await ProductsService.delete(id);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }
}

export function handleProductError(
  error: Error,
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  if (error instanceof ProductError) {
    res.status(error.statusCode).json({ success: false, message: error.message });
    return;
  }
  next(error);
}
