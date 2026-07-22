import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { PasswordService } from '../src/modules/auth/password.service';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

const users = [
  { email: 'admin@magazin.kg', password: 'admin123', firstName: 'Админ', lastName: 'Система', role: 'ADMIN' as const },
  { email: 'cashier@magazin.kg', password: 'cashier123', firstName: 'Айгүл', lastName: 'Касымова', role: 'CASHIER' as const },
  { email: 'storekeeper@magazin.kg', password: 'store123', firstName: 'Нурбек', lastName: 'Алиев', role: 'STOREKEEPER' as const },
  { email: 'accountant@magazin.kg', password: 'account123', firstName: 'Гүлнара', lastName: 'Токтосова', role: 'ACCOUNTANT' as const },
];

async function main(): Promise<void> {
  const isProduction = process.env.NODE_ENV === 'production';
  const allowDemoSeed = process.env.ALLOW_DEMO_SEED === 'true';

  if (isProduction && !allowDemoSeed) {
    console.log('⚠️  Production режим: demo колдонуучулар өткөрүлдү.');
    console.log('   Demo маалымат керек болсо: ALLOW_DEMO_SEED=true npm run db:seed');
  }

  console.log('🌱 Seed башталды...');

  const userMap: Record<string, string> = {};
  if (!isProduction || allowDemoSeed) {
    for (const u of users) {
      const passwordHash = await PasswordService.hash(u.password);
      const user = await prisma.user.upsert({
        where: { email: u.email },
        update: {
          role: u.role,
          passwordHash,
          firstName: u.firstName,
          lastName: u.lastName,
          isActive: true,
        },
        create: { email: u.email, passwordHash, firstName: u.firstName, lastName: u.lastName, role: u.role },
      });
      userMap[u.email] = user.id;
      console.log(`✅ ${u.role}: ${user.email}`);
    }
  }

  const categories = [
    { nameKy: 'Суусундуктар', nameRu: 'Напитки' },
    { nameKy: 'Сүт азыктары', nameRu: 'Молочные продукты' },
    { nameKy: 'Нан', nameRu: 'Хлеб' },
    { nameKy: 'Кондитердик азыктар', nameRu: 'Кондитерские изделия' },
    { nameKy: 'Үй-тиричилик товарлары', nameRu: 'Бытовые товары' },
  ];

  const catMap: Record<string, string> = {};
  for (const cat of categories) {
    let existing = await prisma.category.findFirst({ where: { nameKy: cat.nameKy } });
    if (!existing) existing = await prisma.category.create({ data: cat });
    catMap[cat.nameKy] = existing.id;
  }
  console.log(`✅ ${categories.length} категория`);

  const now = new Date();
  const in30days = new Date(now); in30days.setDate(in30days.getDate() + 30);
  const in7days = new Date(now); in7days.setDate(in7days.getDate() + 7);

  const products = [
    { barcode: '4601234567890', nameKy: 'Сүт 1л', nameRu: 'Молоко 1л', brand: 'Айдар', price: 90, costPrice: 65, stock: 48, minStock: 10, unit: 'шт', cat: 'Сүт азыктары', supplier: 'Айдар ААК', shelf: 'A-01-1', expiry: in7days },
    { barcode: '4601234567891', nameKy: 'Нан жумшак', nameRu: 'Хлеб мягкий', brand: 'Бишкек Нан', price: 50, costPrice: 30, stock: 25, minStock: 15, unit: 'шт', cat: 'Нан', supplier: 'Бишкек Нан', shelf: 'B-02-1', expiry: in30days },
    { barcode: '4601234567892', nameKy: 'Картоп 1кг', nameRu: 'Картофель 1кг', brand: '', price: 45, costPrice: 28, stock: 120, minStock: 20, unit: 'кг', cat: 'Суусундуктар', supplier: 'Фермер Кооп', shelf: 'C-01-1', soldByWeight: true },
    { barcode: '4601234567893', nameKy: 'Кока-Кола 1.5л', nameRu: 'Кока-Кола 1.5л', brand: 'Coca-Cola', price: 120, costPrice: 85, stock: 36, minStock: 12, unit: 'шт', cat: 'Суусундуктар', supplier: 'Coca-Cola HBC', shelf: 'A-03-2', expiry: in30days },
    { barcode: '4601234567894', nameKy: 'Айран 0.5л', nameRu: 'Айран 0.5л', brand: 'Айдар', price: 55, costPrice: 38, stock: 8, minStock: 10, unit: 'шт', cat: 'Сүт азыктары', supplier: 'Айдар ААК', shelf: 'A-01-2', expiry: in7days },
    { barcode: '4601234567895', nameKy: 'Курт 200г', nameRu: 'Курт 200г', brand: 'Нарын', price: 180, costPrice: 120, stock: 5, minStock: 8, unit: 'шт', cat: 'Сүт азыктары', supplier: 'Нарын Кооп', shelf: 'A-02-1', expiry: in30days },
    { barcode: '4601234567896', nameKy: 'Шоколад Alpen Gold', nameRu: 'Шоколад Alpen Gold', brand: 'Alpen Gold', price: 95, costPrice: 70, stock: 22, minStock: 10, unit: 'шт', cat: 'Кондитердик азыктар', supplier: 'Mondelez', shelf: 'D-01-3', expiry: in30days },
    { barcode: '4601234567897', nameKy: 'Самсунг 2кг', nameRu: 'Порошок 2кг', brand: 'Samson', price: 350, costPrice: 260, stock: 3, minStock: 5, unit: 'шт', cat: 'Үй-тиричилик товарлары', supplier: 'Procter KG', shelf: 'E-01-1' },
    { barcode: '4601234567898', nameKy: 'Пияз 1кг', nameRu: 'Лук 1кг', brand: '', price: 35, costPrice: 22, stock: 0, minStock: 10, unit: 'кг', cat: 'Суусундуктар', supplier: 'Фермер Кооп', shelf: 'C-02-1', soldByWeight: true },
    { barcode: '4601234567899', nameKy: 'Макарон 400г', nameRu: 'Макароны 400г', brand: 'Ассы', price: 65, costPrice: 42, stock: 55, minStock: 15, unit: 'шт', cat: 'Кондитердик азыктар', supplier: 'Ассы ЗАО', shelf: 'D-02-1', expiry: in30days },
  ];

  for (const p of products) {
    const soldByWeight = 'soldByWeight' in p && !!p.soldByWeight;
    await prisma.product.upsert({
      where: { barcode: p.barcode },
      update: {
        stock: p.stock, price: p.price, costPrice: p.costPrice, minStock: p.minStock,
        brand: p.brand || null, supplier: p.supplier, shelfLocation: p.shelf,
        expiryDate: p.expiry ?? null,
        soldByWeight,
        barcodeType: 'FACTORY',
      },
      create: {
        barcode: p.barcode,
        barcodeType: 'FACTORY',
        soldByWeight,
        nameKy: p.nameKy,
        nameRu: p.nameRu,
        brand: p.brand || null,
        price: p.price,
        costPrice: p.costPrice,
        stock: p.stock,
        minStock: p.minStock,
        unit: p.unit,
        supplier: p.supplier,
        shelfLocation: p.shelf,
        arrivalDate: now,
        expiryDate: p.expiry ?? null,
        categoryId: catMap[p.cat],
      },
    });
  }

  // QR токендерди P:{id} форматына жаңылоо
  const allProducts = await prisma.product.findMany({ select: { id: true, qrCode: true } });
  for (const prod of allProducts) {
    if (!prod.qrCode?.startsWith('P:')) {
      await prisma.product.update({
        where: { id: prod.id },
        data: { qrCode: `P:${prod.id}` },
      });
    }
  }
  console.log(`✅ ${products.length} товар`);

  const cashierId = userMap['cashier@magazin.kg'];
  const existingSales = await prisma.sale.count();
  if (existingSales === 0) {
    const productMap: Record<string, string> = {};
    for (const p of products) {
      const prod = await prisma.product.findUnique({ where: { barcode: p.barcode } });
      if (prod) productMap[p.barcode] = prod.id;
    }

    const saleTemplates = [
      { daysAgo: 0, items: [{ barcode: '4601234567890', qty: 2 }, { barcode: '4601234567891', qty: 3 }], method: 'CASH' as const },
      { daysAgo: 0, items: [{ barcode: '4601234567893', qty: 1 }, { barcode: '4601234567896', qty: 2 }], method: 'CARD' as const },
      { daysAgo: 1, items: [{ barcode: '4601234567899', qty: 4 }], method: 'CASH' as const },
    ];

    let saleNum = 1;
    for (const tmpl of saleTemplates) {
      const createdAt = new Date(); createdAt.setDate(createdAt.getDate() - tmpl.daysAgo);
      let subtotal = 0;
      const itemData: { productId: string; quantity: number; unitPrice: number; total: number }[] = [];
      for (const item of tmpl.items) {
        const prod = products.find((x) => x.barcode === item.barcode)!;
        const total = prod.price * item.qty;
        subtotal += total;
        itemData.push({ productId: productMap[item.barcode], quantity: item.qty, unitPrice: prod.price, total });
      }
      await prisma.sale.create({
        data: {
          saleNumber: `S-${String(saleNum).padStart(5, '0')}`,
          subtotal, discount: 0, total: subtotal,
          paymentMethod: tmpl.method, status: 'COMPLETED', cashierId, createdAt,
          items: { create: itemData },
        },
      });
      saleNum++;
    }
    console.log(`✅ ${saleTemplates.length} демо сатуу`);
  }

  const existingExpenses = await prisma.expense.count();
  if (existingExpenses === 0) {
    const adminId = userMap['admin@magazin.kg'];
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    await prisma.expense.createMany({
      data: [
        { title: 'Аренда дүкөн', amount: 25000, category: 'RENT', expenseDate: monthStart, createdById: adminId },
        { title: 'Айлык төлөм', amount: 45000, category: 'SALARY', expenseDate: monthStart, createdById: adminId },
        { title: 'Электр энергиясы', amount: 3500, category: 'UTILITIES', expenseDate: new Date(now.getFullYear(), now.getMonth(), 5), createdById: adminId },
        { title: 'Тазалоо каражаттары', amount: 1200, category: 'SUPPLIES', expenseDate: new Date(now.getFullYear(), now.getMonth(), 10), createdById: adminId },
      ],
    });
    console.log('✅ 4 демо чыгым');
  }

  await prisma.storeSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      storeNameKy: 'Айдар Маркет',
      storeNameRu: 'Айдар Маркет',
      addressKy: 'Бишкек ш., Чүй проспекти 123',
      addressRu: 'г. Бишкек, пр. Чуй 123',
      phone: '+996 555 123 456',
      email: 'info@magazin.kg',
      taxId: '12345678901234',
      taxName: 'ОсОО «Айдар Маркет»',
      taxRate: 12,
      receiptFooterKy: 'Сатып алганыңыз үчүн рахмат!',
      receiptFooterRu: 'Спасибо за покупку!',
      receiptShowLogo: true,
      receiptShowTax: true,
      defaultLocale: 'ky',
      currency: 'KGS',
    },
  });
  console.log('✅ Дүкөн жөндөөлөрү');

  console.log('🌱 Seed аяктады!');
}

main()
  .catch((e) => { console.error('❌ Seed катасы:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
