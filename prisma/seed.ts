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

  for (const name of ["FMDC/FMPC", "Autres"]) {
    await prisma.faculty.upsert({
      where: { name },
      update: {},
      create: { name, soloPrice: 0, duoPrice: 0 },
    });
  }

  const prices = [
    { name: "FMDC/FMPC", solo: [1400, 1800, 2500], duo: [2100, 2600, 3000] },
    { name: "Autres", solo: [1600, 2200, 2700], duo: [2500, 3000, 4000] },
  ];
  for (const row of prices) {
    const faculty = await prisma.faculty.findUniqueOrThrow({
      where: { name: row.name },
    });
    for (let i = 0; i < 3; i++) {
      const pack = await prisma.pack.upsert({
        where: { name: `Pack ${i + 1}` },
        update: {},
        create: { name: `Pack ${i + 1}`, price: prices[0].solo[i] },
      });
      await prisma.facultyPackRate.upsert({
        where: { facultyId_packId: { facultyId: faculty.id, packId: pack.id } },
        update: {},
        create: {
          facultyId: faculty.id,
          packId: pack.id,
          soloPrice: row.solo[i],
          duoPrice: row.duo[i],
        },
      });
    }
  }

  for (const [name, price] of [
    ["Toge", 400],
    ["Perso toge", 30],
    ["Tableau", 400],
    ["Miroir", 400],
    ["Album", 600],
    ["Photobook", 1200],
    ["Déco", 1200],
  ] as const) {
    await prisma.supplement.upsert({
      where: { name },
      update: {},
      create: { name, price, isActive: true },
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
