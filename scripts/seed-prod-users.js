const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const users = [
    { email: 'admin@magazin.kg', password: 'admin123', firstName: 'Admin', lastName: 'System', role: 'ADMIN' },
    { email: 'cashier@magazin.kg', password: 'cashier123', firstName: 'Cashier', lastName: 'Demo', role: 'CASHIER' },
  ];

  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash, role: u.role, isActive: true },
      create: {
        email: u.email,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
      },
    });
    console.log('OK', u.email);
  }

  await prisma.storeSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      storeNameKy: 'Aidar Market',
      storeNameRu: 'Aidar Market',
      currency: 'KGS',
      defaultLocale: 'ky',
    },
  });
  console.log('settings OK');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
