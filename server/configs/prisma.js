import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

// Verify DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error('❌ CRITICAL: DATABASE_URL is not set!');
  throw new Error('DATABASE_URL environment variable is required');
}

console.log('✅ Prisma initializing with DATABASE_URL');

// Use regular Prisma Client (no adapter needed for regular Node.js servers)
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Test connection on initialization
prisma.$connect()
  .then(() => console.log('✅ Prisma connected to database'))
  .catch((e) => console.error('❌ Prisma connection error:', e.message));

export default prisma;