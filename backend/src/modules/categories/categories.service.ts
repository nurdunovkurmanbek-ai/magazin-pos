import { prisma } from '../../config/database';
import type { CategoryInput } from './categories.schema';
import type { Category } from '@magazin/shared';

export class CategoryError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'CategoryError';
  }
}

/**
 * Категориялар бизнес-логикасы
 */
export class CategoriesService {
  /** Бардык категорияларды алуу */
  static async findAll(includeInactive = false): Promise<Category[]> {
    const categories = await prisma.category.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { nameKy: 'asc' },
      include: { _count: { select: { products: true } } },
    });

    return categories.map(this.toCategory);
  }

  /** Бир категорияны алуу */
  static async findById(id: string): Promise<Category> {
    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!category) {
      throw new CategoryError('Категория табылган жок', 404);
    }

    return this.toCategory(category);
  }

  /** Жаңы категория түзүү */
  static async create(input: CategoryInput): Promise<Category> {
    await this.ensureUniqueNames(input.nameKy, input.nameRu);

    const category = await prisma.category.create({
      data: {
        nameKy: input.nameKy.trim(),
        nameRu: input.nameRu.trim(),
        description: input.description?.trim() || null,
        isActive: input.isActive ?? true,
      },
      include: { _count: { select: { products: true } } },
    });

    return this.toCategory(category);
  }

  /** Категорияны өзгөртүү */
  static async update(id: string, input: CategoryInput): Promise<Category> {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new CategoryError('Категория табылган жок', 404);
    }

    await this.ensureUniqueNames(input.nameKy, input.nameRu, id);

    const category = await prisma.category.update({
      where: { id },
      data: {
        nameKy: input.nameKy.trim(),
        nameRu: input.nameRu.trim(),
        description: input.description?.trim() || null,
        isActive: input.isActive ?? existing.isActive,
      },
      include: { _count: { select: { products: true } } },
    });

    return this.toCategory(category);
  }

  /** Категорияны өчүрүү */
  static async delete(id: string): Promise<void> {
    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!category) {
      throw new CategoryError('Категория табылган жок', 404);
    }

    if (category._count.products > 0) {
      throw new CategoryError(
        'Бул категорияда товарлар бар. Алгач товарларды өчүрүңүз же башка категорияга которуңуз',
        409
      );
    }

    await prisma.category.delete({ where: { id } });
  }

  /** Аталыш уникалдуулугун текшерүү */
  private static async ensureUniqueNames(
    nameKy: string,
    nameRu: string,
    excludeId?: string
  ): Promise<void> {
    const conflict = await prisma.category.findFirst({
      where: {
        id: excludeId ? { not: excludeId } : undefined,
        OR: [
          { nameKy: nameKy.trim() },
          { nameRu: nameRu.trim() },
        ],
      },
    });

    if (conflict) {
      throw new CategoryError('Мындай аталыштагы категория мурунтан бар', 409);
    }
  }

  private static toCategory(category: {
    id: string;
    nameKy: string;
    nameRu: string;
    description: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count?: { products: number };
  }): Category {
    return {
      id: category.id,
      nameKy: category.nameKy,
      nameRu: category.nameRu,
      description: category.description,
      isActive: category.isActive,
      productCount: category._count?.products ?? 0,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    };
  }
}
