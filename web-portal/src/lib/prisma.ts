import { PrismaClient } from '@prisma/client';

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Supabase's pooler is occasionally slow to accept new connections;
// without an explicit timeout the default can surface as EAUTHTIMEOUT/ETIMEDOUT.
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 30000,
  keepAlive: true,
};

let prisma: PrismaClient;

if (typeof window === "undefined") {
  if (process.env.NODE_ENV === "production") {
    const pool = new Pool(poolConfig);
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
  } else {
    if (!globalForPrisma.prisma) {
      const pool = new Pool(poolConfig);
      const adapter = new PrismaPg(pool);
      globalForPrisma.prisma = new PrismaClient({ adapter, log: ['query'] });
    }
    prisma = globalForPrisma.prisma;
  }
}

export { prisma };
