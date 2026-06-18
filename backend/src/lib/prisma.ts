import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Re-connect on lost connection (Railway admin_shutdown / idle timeout)
const withReconnect = async <T>(fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (e: any) {
    if (e?.code === 'P1001' || e?.message?.includes('terminating connection')) {
      await prisma.$disconnect();
      await prisma.$connect();
      return fn();
    }
    throw e;
  }
};

export { withReconnect };

const shutdownHandler = async () => {
  await prisma.$disconnect();
};

process.on('beforeExit', shutdownHandler);
process.on('SIGINT', shutdownHandler);
process.on('SIGTERM', shutdownHandler);
