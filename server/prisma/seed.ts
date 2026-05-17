import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // 1. Create Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-corp' },
    update: {},
    create: {
      name: 'Demo Corp',
      slug: 'demo-corp',
      settings: { asaasApiKey: 'test_key' },
    },
  });

  // 2. Create Admin User
  const user = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      name: 'Admin Demo',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      tenantId: tenant.id,
    },
  });

  // 3. Create a Pipeline and Stages
  const pipeline = await prisma.pipeline.create({
    data: {
      name: 'Vendas Diretas',
      tenantId: tenant.id,
      stages: {
        create: [
          { name: 'Prospecção', order: 0 },
          { name: 'Qualificação', order: 1 },
          { name: 'Proposta', order: 2 },
          { name: 'Negociação', order: 3 },
          { name: 'Fechado', order: 4 },
        ],
      },
    },
    include: { stages: true },
  });

  // 4. Create a Contact
  const contact = await prisma.contact.create({
    data: {
      name: 'Marcelo Cliente',
      phone: '+5511999999999',
      email: 'marcelo@cliente.com',
      tenantId: tenant.id,
    },
  });

  // 5. Create some Deals
  await prisma.deal.create({
    data: {
      title: 'Projeto SaaS',
      value: 15000,
      contactId: contact.id,
      stageId: pipeline.stages[0].id,
      status: 'OPEN',
    },
  });

  // 6. Create some Products
  await prisma.product.createMany({
    data: [
      { name: 'Assinatura Mensal', price: 299.90, tenantId: tenant.id },
      { name: 'Setup Inicial', price: 1500.00, tenantId: tenant.id },
    ],
  });

  console.log('Seed completed! User: admin@demo.com / Pass: admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
