const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { name: { contains: 'hrijit', mode: 'insensitive' } }
  });
  
  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'STUDENT' }
    });
    console.log(`Updated ${user.email} to STUDENT`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
