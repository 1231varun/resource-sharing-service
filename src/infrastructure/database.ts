import { PrismaClient } from '@prisma/client';
import { config } from '@/config';

// Global instance to prevent multiple connections in development
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Create Prisma client with optimized configuration
const createPrismaClient = (): PrismaClient => {
  return new PrismaClient({
    datasources: {
      db: {
        url: config.database.url,
      },
    },
    log: config.server.env === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
  });
};

// Singleton pattern for database client
const prisma = globalThis.__prisma ?? createPrismaClient();

if (config.server.env === 'development') {
  globalThis.__prisma = prisma;
}

// Graceful shutdown handling
process.on('beforeExit', () => {
  void prisma.$disconnect();
});

process.on('SIGINT', () => {
  void prisma.$disconnect().then(() => process.exit(0));
});

process.on('SIGTERM', () => {
  void prisma.$disconnect().then(() => process.exit(0));
});

export { prisma as db };
