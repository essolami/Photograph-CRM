import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/password";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const testClients = [
  {
    name: "Test Client One",
    email: "client.one@example.test",
    phone: "+1 555 0100",
  },
  {
    name: "Test Client Two",
    email: "client.two@example.test",
    phone: "+1 555 0101",
  },
];

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@lumacrm.local";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin123!";
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Studio Admin",
      email: adminEmail,
      passwordHash: await hashPassword(adminPassword),
      canViewClients: true,
      canManageClients: true,
      canViewInvoices: true,
      canManageInvoices: true,
      canManageUsers: true,
    },
  });

  for (const client of testClients) {
    await prisma.client.upsert({
      where: { email: client.email },
      update: client,
      create: client,
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
