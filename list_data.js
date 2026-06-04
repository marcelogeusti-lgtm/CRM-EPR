const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const contacts = await prisma.contact.findMany();
  console.log('--- Contatos no Banco ---');
  contacts.forEach(c => console.log(`${c.id} | ${c.name} | ${c.email} | ${c.phone}`));

  const deals = await prisma.deal.findMany();
  console.log('\n--- Negócios no Banco ---');
  deals.forEach(d => console.log(`${d.id} | ${d.title} | ${d.value}`));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
