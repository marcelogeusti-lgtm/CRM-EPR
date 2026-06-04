const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const deals = await prisma.deal.findMany({ include: { activities: true, contact: true }});
  
  for (const deal of deals) {
    if (deal.activities.length === 0 && !deal.title.includes('WhatsApp')) {
      console.log(`Deletando Deal sem chat: ${deal.title}`);
      await prisma.deal.delete({ where: { id: deal.id } });
    } else {
      console.log(`Mantendo Deal: ${deal.title} (Atividades: ${deal.activities.length})`);
    }
  }

  // Identificar Contatos sem Negócios associados após a deleção
  const contacts = await prisma.contact.findMany({ include: { deals: true } });
  for (const c of contacts) {
    if (c.deals.length === 0) {
      console.log(`Deletando Contact sem deal: ${c.name}`);
      await prisma.contact.delete({ where: { id: c.id } });
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
