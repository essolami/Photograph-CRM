import { type SupplementChoice } from "@/lib/client-data";
import { prisma } from "@/lib/prisma";
import { ClientManager } from "./client-manager";
import { MobileHeader, Sidebar } from "./sidebar";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await requireUser();
  if (!user.canViewClients)
    redirect(user.canManageUsers ? "/admin" : "/forbidden");
  const [clients, packs, supplements, photographers, editors] =
    await Promise.all([
      prisma.client.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.pack.findMany({
        where: { isActive: true },
        include: {
          rates: {
            where: { faculty: { isActive: true } },
            include: { faculty: true },
          },
        },
        orderBy: { id: "asc" },
      }),
      prisma.supplement.findMany({
        where: { isActive: true },
        orderBy: { id: "asc" },
      }),
      prisma.photographer.findMany({ orderBy: { name: "asc" } }),
      prisma.editor.findMany({ orderBy: { name: "asc" } }),
    ]);
  const records = clients.map((c) => ({
    ...c,
    defenseDate: c.defenseDate?.toISOString().slice(0, 10) ?? "",
    basePrice: c.basePrice.toString(),
    supplements: c.supplements as SupplementChoice[],
    discount: c.discount.toString(),
    total: c.total.toString(),
    advance: c.advance.toString(),
    grossProfit: c.grossProfit?.toString() ?? "",
  }));
  const catalog = {
    packs: packs.map((p) => ({
      id: p.id,
      name: p.name,
      rates: p.rates.map((r) => ({
        facultyId: r.facultyId,
        name: r.faculty.name,
        soloPrice: r.soloPrice.toString(),
        duoPrice: r.duoPrice.toString(),
      })),
    })),
    supplements: supplements.map((s) => ({
      id: s.id,
      name: s.name,
      price: s.price.toString(),
    })),
    photographers: photographers.map((p) => ({
      id: p.id,
      name: p.name,
      phone: p.phone,
      isActive: p.isActive,
    })),
    editors: editors.map((p) => ({
      id: p.id,
      name: p.name,
      isActive: p.isActive,
    })),
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <div className="min-w-0 flex-1">
        <MobileHeader />
        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8 sm:py-12">
          <ClientManager
            clients={records}
            catalog={catalog}
            canManage={user.canManageClients}
            canExport={user.canManageUsers}
          />
        </main>
      </div>
    </div>
  );
}
