require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });

async function main() {
  try {
    let recruiter = await prisma.user.findFirst({ where: { role: 'RECRUITER' } });
    if (!recruiter) {
      recruiter = await prisma.user.create({
        data: {
          email: "recruiter2@example.com",
          password: "hashed_password",
          name: "Default Recruiter",
          role: "RECRUITER"
        }
      });
      console.log("Created recruiter:", recruiter);
    } else {
      console.log("Found recruiter:", recruiter);
    }

    const newJob = await prisma.job.create({
      data: {
        title: "Test Job",
        company: "Test Co",
        location: "Test Loc",
        description: "Test Desc",
        recruiterId: recruiter.id
      }
    });
    console.log("Created job:", newJob);
  } catch(e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
