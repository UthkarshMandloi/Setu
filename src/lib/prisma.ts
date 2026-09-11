import { PrismaClient } from "@prisma/client";

// One shared client so dev hot-reload doesn't open a new Postgres connection pool per module.
// Connection string comes from DATABASE_URL (Aiven PostgreSQL).
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
