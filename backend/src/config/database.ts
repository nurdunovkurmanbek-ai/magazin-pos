import { PrismaClient } from '@prisma/client';
import { env } from './env';

/**
 * Prisma клиенти — singleton паттерни
 * Өндүрүшкө даяр: development режиминде query логдору иштейт
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.isDev ? ['query', 'error', 'warn'] : ['error'],
  });

if (env.isDev) {
  globalForPrisma.prisma = prisma;
}

/**
 * База менен байланышты текшерүү
 */
export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
}

/**
 * База байланышын жабуу
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
