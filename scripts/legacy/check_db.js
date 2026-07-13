const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const deals = await prisma.deal.findMany();
  console.log("Deals:", deals.map(d => d.title));
  
  const contacts = await prisma.contact.findMany();
  console.log("Contacts:", contacts.map(c => c.name));
}

main().catch(console.error).finally(() => prisma.$disconnect());
