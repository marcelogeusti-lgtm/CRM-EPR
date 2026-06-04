const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findFirst();
  console.log('Tenant:', tenant);
  
  if (!tenant) return;

  const deals = await prisma.deal.findMany({
    where: { tenantId: tenant.id },
    include: {
      contact: true,
      activities: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  console.log('Deals fetched:', JSON.stringify(deals, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
