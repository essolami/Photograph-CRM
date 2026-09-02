import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

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
