/**
 * Production seed — бош базага баштапкы маалыматты куят.
 *
 * Контейнер башталганда RUN_SEED=true болсо иштейт (Dockerfile CMD кара).
 * Таза JS: production образда tsx да, backend/src да жок.
 * Идемпотенттүү — кайра-кайра иштесе да кайталанбайт.
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@magazin.kg';
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'admin123';
const cashierEmail = process.env.SEED_CASHIER_EMAIL ?? 'cashier@magazin.kg';
const cashierPassword = process.env.SEED_CASHIER_PASSWORD ?? 'cashier123';

const categories = [
  { nameKy: 'Суусундуктар', nameRu: 'Напитки' },
  { nameKy: 'Сүт азыктары', nameRu: 'Молочные продукты' },
  { nameKy: 'Нан', nameRu: 'Хлеб' },
  { nameKy: 'Кондитердик азыктар', nameRu: 'Кондитерские изделия' },
  { nameKy: 'Үй-тиричилик товарлары', nameRu: 'Бытовые товары' },
];

const products = [
  { barcode: '4870004102132', nameKy: 'Шалбаа суусу 1.5л', nameRu: 'Вода Шалбаа 1.5л', price: 45, costPrice: 32, stock: 120, cat: 'Суусундуктар' },
  { barcode: '4870004102149', nameKy: 'Кока-Кола 1л', nameRu: 'Кока-Кола 1л', price: 95, costPrice: 70, stock: 80, cat: 'Суусундуктар' },
  { barcode: '4870004102156', nameKy: 'Максым 1л', nameRu: 'Максым 1л', price: 60, costPrice: 42, stock: 45, cat: 'Суусундуктар' },
  { barcode: '4870204103201', nameKy: 'Сүт 2.5% 1л', nameRu: 'Молоко 2.5% 1л', price: 85, costPrice: 65, stock: 60, cat: 'Сүт азыктары' },
  { barcode: '4870204103218', nameKy: 'Каймак 20% 400г', nameRu: 'Сметана 20% 400г', price: 120, costPrice: 92, stock: 30, cat: 'Сүт азыктары' },
  { barcode: '4870204103225', nameKy: 'Сары май 200г', nameRu: 'Сливочное масло 200г', price: 210, costPrice: 168, stock: 25, cat: 'Сүт азыктары' },
  { barcode: '4870304104301', nameKy: 'Ак нан', nameRu: 'Белый хлеб', price: 35, costPrice: 24, stock: 50, cat: 'Нан' },
  { barcode: '4870304104318', nameKy: 'Токоч', nameRu: 'Лепёшка', price: 30, costPrice: 20, stock: 40, cat: 'Нан' },
  { barcode: '4870404105401', nameKy: 'Шоколад «Кыргызстан» 100г', nameRu: 'Шоколад «Кыргызстан» 100г', price: 150, costPrice: 115, stock: 35, cat: 'Кондитердик азыктар' },
  { barcode: '4870404105418', nameKy: 'Печенье 300г', nameRu: 'Печенье 300г', price: 90, costPrice: 68, stock: 55, cat: 'Кондитердик азыктар' },
  { barcode: '4870504106501', nameKy: 'Самын 100г', nameRu: 'Мыло 100г', price: 55, costPrice: 38, stock: 70, cat: 'Үй-тиричилик товарлары' },
  { barcode: '4870504106518', nameKy: 'Идиш жуучу каражат 500мл', nameRu: 'Средство для мытья посуды 500мл', price: 175, costPrice: 130, stock: 28, cat: 'Үй-тиричилик товарлары' },
];

async function seedUser(email, password, firstName, lastName, role) {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role, isActive: true },
    create: { email, passwordHash, firstName, lastName, role },
  });
  console.log(`✅ ${role}: ${email}`);
}

async function main() {
  console.log('🌱 Production seed башталды...');

  await seedUser(adminEmail, adminPassword, 'Админ', 'Система', 'ADMIN');
  await seedUser(cashierEmail, cashierPassword, 'Айгүл', 'Касымова', 'CASHIER');

  await prisma.storeSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default', currency: 'KGS', defaultLocale: 'ky' },
  });
  console.log('✅ Дүкөн жөндөөлөрү');

  // Demo товарлар — SEED_DEMO=false болсо өткөрүлөт
  if (process.env.SEED_DEMO === 'false') {
    console.log('⏭️  Demo товарлар өткөрүлдү (SEED_DEMO=false)');
    return;
  }

  const catMap = {};
  for (const cat of categories) {
    let existing = await prisma.category.findFirst({ where: { nameKy: cat.nameKy } });
    if (!existing) existing = await prisma.category.create({ data: cat });
    catMap[cat.nameKy] = existing.id;
  }
  console.log(`✅ Категориялар: ${categories.length}`);

  for (const p of products) {
    const data = {
      nameKy: p.nameKy,
      nameRu: p.nameRu,
      price: p.price,
      costPrice: p.costPrice,
      stock: p.stock,
      categoryId: catMap[p.cat],
    };
    await prisma.product.upsert({
      where: { barcode: p.barcode },
      update: {},
      create: { barcode: p.barcode, ...data },
    });
  }
  console.log(`✅ Товарлар: ${products.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed катасы:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
