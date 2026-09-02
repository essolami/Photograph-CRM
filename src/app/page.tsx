import { prisma } from "@/lib/prisma";
import { ClientManager } from "./client-manager";
import { MobileHeader, Sidebar } from "./sidebar";

export const dynamic = "force-dynamic";

export default async function Home() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <MobileHeader />
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
          <ClientManager clients={clients} />
        </main>
      </div>
    </div>
  );
}
