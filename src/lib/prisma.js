// lib/prisma.js  (CommonJS)
const { PrismaClient } = require('@prisma/client');

const globalForPrisma = global;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['warn', 'error'], // opcional
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
