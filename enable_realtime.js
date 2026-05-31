const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`ALTER PUBLICATION supabase_realtime ADD TABLE "Deal"`);
    await prisma.$executeRawUnsafe(`ALTER PUBLICATION supabase_realtime ADD TABLE "Activity"`);
    console.log("Realtime enabled!");
  } catch (e) {
    console.log("Ignored error (probably already exists):", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
