# Magazin POS — Азык-түлүк дүкөнү үчүн POS системасы

Кыргызча жана орусча интерфейстүү профессионалдуу POS системасы. Сатуулар, товарлар, кампа, отчёттор, каржы, backup жана касса функцияларын камтыйт.

## Мүмкүнчүлүктөр

- **POS касса** — тез сатуу, төлөм ыкмалары, чек
- **Товарлар жана категориялар** — штрих-код, QR, сүрөт, баа
- **Кампа** — калдык, кирүү/чыгуу, мөөнөтү бүткөн товарлар
- **Отчёттор** — сатуу, товарлар, кызматкерлер, каржы
- **Жөндөөлөр** — дүкөн маалыматы, салык, чек шаблону, backup
- **RBAC** — Админ, Кассир, Кампачы, Бухгалтер ролдору
- **i18n** — кыргызча / орусча

## Технологиялар

| Катмар | Стек |
|--------|------|
| Backend | Node.js 20, Express, Prisma, PostgreSQL |
| Frontend | React 18, TypeScript, Vite, Tailwind, shadcn/ui |
| Desktop | Electron |
| Shared | TypeScript типтер жана RBAC |

## Талаптар

- **Node.js** 20+
- **npm** 10+
- **Docker** (PostgreSQL үчүн)
- **Git**

## Орнотуу (Development)

### 1. Репозиторийди клондоо

```bash
git clone <repo-url>
cd магазин
```

### 2. Түзмөктөрдү орнотуу

```bash
npm run install:all
```

### 3. Орто өзгөрмөлөрүн (.env)

```bash
cp .env.example .env
```

`.env` файлын өзгөртүңүз. **Production** үчүн JWT секреттерди 32+ символдук коопсуз маанилерге алмаштырыңыз.

### 4. PostgreSQL иштетүү

```bash
docker-compose up -d
```

### 5. Базаны даярдоо

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### 6. Иштетүү

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api/v1
- Health: http://localhost:3001/api/v1/health

### Demo колдонуучулар (development)

| Email | Сырсөз | Роль |
|-------|--------|------|
| admin@magazin.kg | admin123 | Админ |
| cashier@magazin.kg | cashier123 | Кассир |
| storekeeper@magazin.kg | store123 | Кампачы |
| accountant@magazin.kg | account123 | Бухгалтер |

> ⚠️ Production режиминде demo колдонуучулар автоматтык түзүлбөйт.

## Production орнотуу

### Docker Compose (сунушталат)

1. `.env` файлын production маанилери менен толтуруңуз:

```env
NODE_ENV=production
JWT_ACCESS_SECRET=<32+ символдук коопсуз секрет>
JWT_REFRESH_SECRET=<32+ символдук коопсуз секрет>
POSTGRES_PASSWORD=<күчтүү сырсөз>
CORS_ORIGIN=https://your-domain.kg
PUBLIC_APP_URL=https://your-domain.kg
```

2. Иштетүү:

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

3. Колдонуу: http://localhost:3001 (же `APP_PORT`)

### Кол менен орнотуу

```bash
npm run build
cd backend
npx prisma migrate deploy   # же db:push
NODE_ENV=production SERVE_FRONTEND=true node dist/server.js
```

## Тесттер

```bash
# Бардык тесттер
npm test

# Backend coverage
npm run test:coverage --prefix backend

# Watch режими
npm run test:watch --prefix backend
```

Тесттер: RBAC уруксаттары, auth валидация, сырсөз хэши, health endpoint.

## Backup жана Restore

**Жол:** Жөндөөлөр → Backup

- **Кол менен backup** — «Азыр түзүү»
- **Автоматтык backup** — интервал жана сактоо саны
- **Restore** — `RESTORE` деп ырастоо талап кылынат
- Restore алдында автоматтык PRE_RESTORE backup түзүлөт

Backup файлдары: `backend/backups/`

## API

Негизги endpoint'тер:

```
POST   /api/v1/auth/login
GET    /api/v1/health
GET    /api/v1/products
POST   /api/v1/sales
GET    /api/v1/reports/sales
GET    /api/v1/settings
GET    /api/v1/backups
```

## Коопсуздук

- JWT access + refresh токендер
- bcrypt (12 rounds) сырсөз хэши
- Helmet, CORS, rate limiting
- Auth brute-force коргоо (login: 5 аракет / 15 мүн)
- Production JWT секрет валидациясы
- RBAC уруксаттар
- Production режиминде stack trace жашырылат
- Demo seed production'да өчүрүлгөн

## Desktop (Electron)

```bash
npm run dev:desktop    # Development
npm run build:desktop  # Build
npm run dist --prefix electron  # Installer
```

## Структура долбоор

```
магазин/
├── backend/          # Express API
├── frontend/         # React SPA
├── shared/           # Бөлүшүлгөн типтер
├── electron/         # Desktop shell
├── docker-compose.yml
├── docker-compose.prod.yml
└── Dockerfile
```

## Пайдалуу командалар

| Команда | Максаты |
|---------|---------|
| `npm run dev` | Backend + Frontend |
| `npm run build` | Production build |
| `npm test` | Тесттер |
| `npm run db:studio` | Prisma Studio |
| `npm run db:migrate` | Миграция (dev) |
| `npm run db:migrate:deploy` | Миграция (prod) |

## Көмөк

Каталар чыкса:

1. Docker иштеп жатабы: `docker ps`
2. `.env` туурабы текшериңиз
3. `npm run db:generate && npm run db:push`
4. Health текшерүү: `GET /api/v1/health`

---

**Magazin POS** v1.0.0 — Кыргызстандагы азык-түлүк дүкөндөрү үчүн
