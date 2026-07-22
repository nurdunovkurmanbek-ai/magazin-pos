import { z } from 'zod';
import { allowsInternalBarcode, normalizeBarcode } from '@magazin/shared';

const barcodeTypeEnum = z.enum(['FACTORY', 'INTERNAL']);

/** Продукт түзүү/өзгөртүү схемасы */
export const productSchema = z
  .object({
    nameKy: z.string().min(1, 'Кыргызча аталыш талап кылынат').max(200),
    nameRu: z.string().min(1, 'Орусча аталыш талап кылынат').max(200),
    barcode: z.string().max(50).optional().nullable(),
    barcodeType: barcodeTypeEnum.optional().default('FACTORY'),
    soldByWeight: z.boolean().optional().default(false),
    isSelfPacked: z.boolean().optional().default(false),
    noFactoryBarcode: z.boolean().optional().default(false),
    generateInternalBarcode: z.boolean().optional().default(false),
    qrCode: z.string().max(100).optional().nullable(),
    brand: z.string().max(100).optional().nullable(),
    description: z.string().max(1000).optional().nullable(),
    price: z.number().min(0, 'Сатуу баасы терс болбойт'),
    costPrice: z.number().min(0, 'Сатып алуу баасы терс болбойт'),
    stock: z.number().min(0).default(0),
    minStock: z.number().min(0).default(10),
    unit: z.string().max(20).default('шт'),
    supplier: z.string().max(200).optional().nullable(),
    arrivalDate: z.string().optional().nullable(),
    expiryDate: z.string().optional().nullable(),
    shelfLocation: z.string().max(50).optional().nullable(),
    categoryId: z.string().min(1, 'Категория талап кылынат'),
    isActive: z.boolean().optional().default(true),
  })
  .superRefine((data, ctx) => {
    const code = normalizeBarcode(data.barcode);
    const special = allowsInternalBarcode({
      soldByWeight: data.soldByWeight,
      isSelfPacked: data.isSelfPacked,
      noFactoryBarcode: data.noFactoryBarcode,
    });

    if (data.generateInternalBarcode && !special) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Ички штрихкод өзгөчө учурларда гана (салмак / өз таңгак / заводдук жок)',
        path: ['generateInternalBarcode'],
      });
    }

    if (!code && !data.generateInternalBarcode && !special) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Заводдук штрихкод талап кылынат (сканерлеңиз же киргизиңиз)',
        path: ['barcode'],
      });
    }
  });

export const productIdSchema = z.object({
  id: z.string().min(1),
});

export const productQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  lowStock: z.coerce.boolean().optional(),
  includeInactive: z.coerce.boolean().optional(),
});

export const barcodeLookupSchema = z.object({
  code: z.string().min(1).max(64),
});

export type ProductInput = z.infer<typeof productSchema>;
export type ProductQuery = z.infer<typeof productQuerySchema>;
