/**
 * Кардарга көрсөтүү үчүн 1000 демо товар (единица: шт).
 * Иштетүү: npm run db:seed:demo1000 --prefix backend
 */
import { PrismaClient, BarcodeType } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

const TARGET = 1000;

const CATEGORIES = [
  { nameKy: 'Суусундуктар', nameRu: 'Напитки' },
  { nameKy: 'Сүт азыктары', nameRu: 'Молочные продукты' },
  { nameKy: 'Нан', nameRu: 'Хлеб' },
  { nameKy: 'Кондитердик азыктар', nameRu: 'Кондитерские изделия' },
  { nameKy: 'Үй-тиричилик товарлары', nameRu: 'Бытовые товары' },
  { nameKy: 'Бакалея', nameRu: 'Бакалея' },
  { nameKy: 'Эт жана колбаса', nameRu: 'Мясо и колбасы' },
  { nameKy: 'Жемиш-жашылча', nameRu: 'Фрукты и овощи' },
  { nameKy: 'Гигиена', nameRu: 'Гигиена' },
  { nameKy: 'Бала-бакча товарлары', nameRu: 'Детские товары' },
];

const TEMPLATES: Array<{
  cat: string;
  brand: string;
  supplier: string;
  names: Array<{ ky: string; ru: string; size?: string }>;
  priceMin: number;
  priceMax: number;
  margin: number;
}> = [
  {
    cat: 'Суусундуктар',
    brand: 'Coca-Cola',
    supplier: 'Coca-Cola HBC',
    priceMin: 45,
    priceMax: 180,
    margin: 1.35,
    names: [
      { ky: 'Кока-Кола', ru: 'Кока-Кола', size: '0.5л' },
      { ky: 'Кока-Кола', ru: 'Кока-Кола', size: '1л' },
      { ky: 'Кока-Кола', ru: 'Кока-Кола', size: '1.5л' },
      { ky: 'Фанта апельсин', ru: 'Фанта апельсин', size: '1л' },
      { ky: 'Спрайт', ru: 'Спрайт', size: '1л' },
      { ky: 'BonAqua суу', ru: 'BonAqua вода', size: '0.5л' },
      { ky: 'BonAqua суу', ru: 'BonAqua вода', size: '1.5л' },
    ],
  },
  {
    cat: 'Суусундуктар',
    brand: 'Shoro',
    supplier: 'Shoro ААК',
    priceMin: 35,
    priceMax: 90,
    margin: 1.4,
    names: [
      { ky: 'Максым', ru: 'Максым', size: '0.5л' },
      { ky: 'Жарма', ru: 'Жарма', size: '0.5л' },
      { ky: 'Чалап', ru: 'Чалап', size: '0.5л' },
      { ky: 'Аралашкы', ru: 'Аралашкы', size: '1л' },
    ],
  },
  {
    cat: 'Сүт азыктары',
    brand: 'Айдар',
    supplier: 'Айдар ААК',
    priceMin: 40,
    priceMax: 220,
    margin: 1.35,
    names: [
      { ky: 'Сүт', ru: 'Молоко', size: '1л' },
      { ky: 'Сүт', ru: 'Молоко', size: '0.5л' },
      { ky: 'Айран', ru: 'Айран', size: '0.5л' },
      { ky: 'Кефир', ru: 'Кефир', size: '0.9л' },
      { ky: 'Каймак', ru: 'Сметана', size: '200г' },
      { ky: 'Быштак', ru: 'Творог', size: '180г' },
      { ky: 'Йогурт', ru: 'Йогурт', size: '125г' },
      { ky: 'Май', ru: 'Масло сливочное', size: '180г' },
    ],
  },
  {
    cat: 'Нан',
    brand: 'Бишкек Нан',
    supplier: 'Бишкек Нан',
    priceMin: 25,
    priceMax: 80,
    margin: 1.5,
    names: [
      { ky: 'Нан жумшак', ru: 'Хлеб мягкий' },
      { ky: 'Нан кара', ru: 'Хлеб чёрный' },
      { ky: 'Батон', ru: 'Батон' },
      { ky: 'Лаваш', ru: 'Лаваш' },
      { ky: 'Токоч', ru: 'Лепёшка' },
      { ky: 'Булочка', ru: 'Булочка' },
    ],
  },
  {
    cat: 'Кондитердик азыктар',
    brand: 'Alpen Gold',
    supplier: 'Mondelez',
    priceMin: 50,
    priceMax: 250,
    margin: 1.4,
    names: [
      { ky: 'Шоколад', ru: 'Шоколад', size: '90г' },
      { ky: 'Печенье', ru: 'Печенье', size: '200г' },
      { ky: 'Вафли', ru: 'Вафли', size: '150г' },
      { ky: 'Конфеты', ru: 'Конфеты', size: '200г' },
      { ky: 'Зефир', ru: 'Зефир', size: '250г' },
      { ky: 'Халва', ru: 'Халва', size: '300г' },
    ],
  },
  {
    cat: 'Бакалея',
    brand: 'Ассы',
    supplier: 'Ассы ЗАО',
    priceMin: 40,
    priceMax: 350,
    margin: 1.3,
    names: [
      { ky: 'Макарон', ru: 'Макароны', size: '400г' },
      { ky: 'Күрүч', ru: 'Рис', size: '1кг' },
      { ky: 'Гречка', ru: 'Гречка', size: '800г' },
      { ky: 'Ун', ru: 'Мука', size: '2кг' },
      { ky: 'Шекер', ru: 'Сахар', size: '1кг' },
      { ky: 'Туз', ru: 'Соль', size: '1кг' },
      { ky: 'Чай кара', ru: 'Чай чёрный', size: '100г' },
      { ky: 'Кофе', ru: 'Кофе', size: '100г' },
      { ky: 'Май өсүмдүк', ru: 'Масло растительное', size: '1л' },
    ],
  },
  {
    cat: 'Эт жана колбаса',
    brand: 'Нарын',
    supplier: 'Нарын Кооп',
    priceMin: 180,
    priceMax: 650,
    margin: 1.25,
    names: [
      { ky: 'Колбаса докторская', ru: 'Колбаса докторская', size: '400г' },
      { ky: 'Сосиска', ru: 'Сосиски', size: '400г' },
      { ky: 'Сарделька', ru: 'Сардельки', size: '400г' },
      { ky: 'Ветчина', ru: 'Ветчина', size: '300г' },
      { ky: 'Курица филе', ru: 'Курица филе', size: '1кг' },
    ],
  },
  {
    cat: 'Жемиш-жашылча',
    brand: 'Фермер',
    supplier: 'Фермер Кооп',
    priceMin: 30,
    priceMax: 280,
    margin: 1.4,
    names: [
      { ky: 'Алма пакет', ru: 'Яблоки пакет', size: '1кг' },
      { ky: 'Банан пакет', ru: 'Бананы пакет', size: '1кг' },
      { ky: 'Помидор пакет', ru: 'Помидоры пакет', size: '1кг' },
      { ky: 'Бадыраң пакет', ru: 'Огурцы пакет', size: '1кг' },
      { ky: 'Апельсин пакет', ru: 'Апельсины пакет', size: '1кг' },
      { ky: 'Салат микс', ru: 'Салат микс', size: '200г' },
    ],
  },
  {
    cat: 'Үй-тиричилик товарлары',
    brand: 'Samson',
    supplier: 'Procter KG',
    priceMin: 80,
    priceMax: 480,
    margin: 1.35,
    names: [
      { ky: 'Кир жуугуч порошок', ru: 'Стиральный порошок', size: '2кг' },
      { ky: 'Идиш жуугуч', ru: 'Средство для посуды', size: '500мл' },
      { ky: 'Тазалоочу спрей', ru: 'Чистящий спрей', size: '500мл' },
      { ky: 'Губка пакет', ru: 'Губки пакет', size: '5шт' },
      { ky: 'Чүпүрөк', ru: 'Тряпка', size: '3шт' },
    ],
  },
  {
    cat: 'Гигиена',
    brand: 'Pampers',
    supplier: 'Procter KG',
    priceMin: 50,
    priceMax: 900,
    margin: 1.3,
    names: [
      { ky: 'Самын', ru: 'Мыло', size: '90г' },
      { ky: 'Тиш пастасы', ru: 'Зубная паста', size: '100г' },
      { ky: 'Шампунь', ru: 'Шампунь', size: '400мл' },
      { ky: 'Туалет кагаз', ru: 'Туалетная бумага', size: '8рул' },
      { ky: 'Салфетка', ru: 'Салфетки', size: '100шт' },
    ],
  },
  {
    cat: 'Бала-бакча товарлары',
    brand: 'Huggies',
    supplier: 'Kimberly KG',
    priceMin: 120,
    priceMax: 1200,
    margin: 1.25,
    names: [
      { ky: 'Жаялык', ru: 'Подгузники', size: 'M' },
      { ky: 'Жаялык', ru: 'Подгузники', size: 'L' },
      { ky: 'Нымдуу салфетка', ru: 'Влажные салфетки', size: '72шт' },
      { ky: 'Бала сүт аралашмасы', ru: 'Детская смесь', size: '400г' },
      { ky: 'Бала пюре', ru: 'Детское пюре', size: '100г' },
    ],
  },
];

function ean13CheckDigit(digits12: string): string {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const n = Number(digits12[i]);
    sum += i % 2 === 0 ? n : n * 3;
  }
  return String((10 - (sum % 10)) % 10);
}

function makeBarcode(index: number): string {
  // 200... — демо ички диапазон, уникалдуу EAN-13
  const body = `200${String(index).padStart(9, '0')}`;
  return body + ean13CheckDigit(body);
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function shelfFor(i: number): string {
  const aisle = String.fromCharCode(65 + (i % 8)); // A-H
  const row = String(Math.floor(i / 8) % 20 + 1).padStart(2, '0');
  const bin = String((i % 5) + 1);
  return `${aisle}-${row}-${bin}`;
}

async function ensureCategories(): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  for (const cat of CATEGORIES) {
    let existing = await prisma.category.findFirst({ where: { nameKy: cat.nameKy } });
    if (!existing) {
      existing = await prisma.category.create({ data: cat });
    }
    map[cat.nameKy] = existing.id;
  }
  return map;
}

async function main(): Promise<void> {
  console.log(`🌱 Демо: ${TARGET} товар (шт) киргизүү...`);

  const catMap = await ensureCategories();
  console.log(`✅ ${CATEGORIES.length} категория`);

  const existingDemo = await prisma.product.count({
    where: { barcode: { startsWith: '200' } },
  });
  if (existingDemo >= TARGET) {
    console.log(`ℹ️  Базада буга чейин ${existingDemo} демо товар бар. Кайра кошпойбуз.`);
    return;
  }

  const now = new Date();
  const expiry = new Date(now);
  expiry.setDate(expiry.getDate() + 90);

  const rows: Array<{
    barcode: string;
    barcodeType: BarcodeType;
    nameKy: string;
    nameRu: string;
    brand: string;
    price: number;
    costPrice: number;
    stock: number;
    minStock: number;
    unit: string;
    supplier: string;
    shelfLocation: string;
    arrivalDate: Date;
    expiryDate: Date;
    categoryId: string;
    isActive: boolean;
  }> = [];

  for (let i = 1; i <= TARGET; i++) {
    const tmpl = TEMPLATES[(i - 1) % TEMPLATES.length];
    const name = tmpl.names[(i - 1) % tmpl.names.length];
    const variant = Math.floor((i - 1) / tmpl.names.length) + 1;
    const sizePart = name.size ? ` ${name.size}` : '';
    const suffix = variant > 1 ? ` #${variant}` : '';

    const price = roundMoney(
      tmpl.priceMin + ((i * 17) % Math.max(1, tmpl.priceMax - tmpl.priceMin))
    );
    const costPrice = roundMoney(price / tmpl.margin);
    const stock = 5 + ((i * 13) % 120);
    const minStock = 5 + (i % 15);

    rows.push({
      barcode: makeBarcode(i),
      barcodeType: BarcodeType.FACTORY,
      nameKy: `${name.ky}${sizePart}${suffix}`,
      nameRu: `${name.ru}${sizePart}${suffix}`,
      brand: tmpl.brand,
      price,
      costPrice,
      stock,
      minStock,
      unit: 'шт',
      supplier: tmpl.supplier,
      shelfLocation: shelfFor(i),
      arrivalDate: now,
      expiryDate: expiry,
      categoryId: catMap[tmpl.cat],
      isActive: true,
    });
  }

  const BATCH = 100;
  let created = 0;
  for (let offset = 0; offset < rows.length; offset += BATCH) {
    const chunk = rows.slice(offset, offset + BATCH);
    const result = await prisma.product.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    created += result.count;
    process.stdout.write(`\r📦 ${Math.min(offset + BATCH, TARGET)}/${TARGET}`);
  }
  console.log('');

  // QR коддор
  const products = await prisma.product.findMany({
    where: { barcode: { startsWith: '200' }, OR: [{ qrCode: null }, { NOT: { qrCode: { startsWith: 'P:' } } }] },
    select: { id: true },
  });
  for (const p of products) {
    await prisma.product.update({
      where: { id: p.id },
      data: { qrCode: `P:${p.id}` },
    });
  }

  const total = await prisma.product.count();
  const demoCount = await prisma.product.count({ where: { barcode: { startsWith: '200' } } });
  console.log(`✅ Жаңы кошулду: ${created}`);
  console.log(`✅ Демо товарлар (200...): ${demoCount}`);
  console.log(`✅ Бардык товарлар: ${total}`);
  console.log('🌱 Даяр — кардарга көрсөтсөңүз болот.');
}

main()
  .catch((e) => {
    console.error('❌ Ката:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
