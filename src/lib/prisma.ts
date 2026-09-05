import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prismaClientPaymentsV2: PrismaClient | undefined;
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

// A regenerated Prisma client must replace the instance cached by hot reload.
const cached = globalForPrisma.prismaClientPaymentsV2;
export const prisma =
  cached instanceof PrismaClient
    ? cached
    : new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

if (cached && cached !== prisma) void cached.$disconnect().catch(() => {});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaClientPaymentsV2 = prisma;
}
