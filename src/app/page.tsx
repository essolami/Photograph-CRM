import { prisma } from "@/lib/prisma";
import { ClientManager } from "./client-manager";

export const dynamic = "force-dynamic";

export default async function Home() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-10 sm:px-8 sm:py-14">
      <ClientManager clients={clients} />
    </main>
  );
}
