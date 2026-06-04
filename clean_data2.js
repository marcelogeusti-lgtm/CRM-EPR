const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const deals = await prisma.deal.findMany();
  for (const deal of deals) {
    if (!deal.title.includes('WhatsApp')) {
      console.log(`Deletando Deal fictício: ${deal.title}`);
      
      // Delete activities manually if cascade isn't working
      await prisma.activity.deleteMany({ where: { dealId: deal.id } });
      
      // Delete conversation and messages manually
      const convs = await prisma.conversation.findMany({ where: { dealId: deal.id } });
      for (const conv of convs) {
        await prisma.message.deleteMany({ where: { conversationId: conv.id } });
        await prisma.conversation.delete({ where: { id: conv.id } });
      }

      await prisma.deal.delete({ where: { id: deal.id } });
    }
  }

  // Delete Contacts without deals
  const contacts = await prisma.contact.findMany({ include: { deals: true } });
  for (const c of contacts) {
    if (c.deals.length === 0) {
      console.log(`Deletando Contact fictício: ${c.name}`);
      await prisma.contact.delete({ where: { id: c.id } });
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
