import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prismaClientPaymentsV2: PrismaClient | undefined;
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

// Reuse the client between requests. This is important on Vercel/Neon because
// creating a new Prisma client for every navigation adds connection latency.
export const prisma =
  globalForPrisma.prismaClientPaymentsV2 ??
  new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

globalForPrisma.prismaClientPaymentsV2 = prisma;
