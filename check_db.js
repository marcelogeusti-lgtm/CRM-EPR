const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const messages = await prisma.message.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
  console.log("=== LATEST MESSAGES ===");
  console.log(messages);

  const activities = await prisma.activity.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
  console.log("=== LATEST ACTIVITIES ===");
  console.log(activities);
}

main().catch(console.error).finally(() => prisma.$disconnect());
