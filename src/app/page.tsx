import { prisma } from "@/lib/prisma";
import { ClientManager } from "./client-manager";
import { MobileHeader, Sidebar } from "./sidebar";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await requireUser();
  if (!user.canViewClients) redirect(user.canManageUsers ? "/admin" : "/forbidden");
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <div className="min-w-0 flex-1">
        <MobileHeader />
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
          <ClientManager clients={clients} canManage={user.canManageClients} />
        </main>
      </div>
    </div>
  );
}
