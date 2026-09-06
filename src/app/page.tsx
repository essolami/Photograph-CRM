import { Suspense } from "react";
import { type SupplementChoice } from "@/lib/client-data";
import { prisma } from "@/lib/prisma";
import { ClientManager } from "./client-manager";
import { MobileHeader, Sidebar } from "./sidebar";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function ClientListLoading() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="h-10 w-48 rounded-lg bg-slate-200" />
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <div className="h-10 min-w-64 flex-1 rounded-lg bg-slate-100" />
          <div className="h-10 w-36 rounded-lg bg-slate-100" />
          <div className="h-10 w-32 rounded-lg bg-slate-100" />
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-5 gap-4 border-b border-slate-200 bg-indigo-50/70 px-5 py-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-4 rounded bg-indigo-100" />
          ))}
        </div>
        {Array.from({ length: 4 }).map((_, row) => (
          <div key={row} className="grid grid-cols-5 gap-4 border-b border-slate-100 px-5 py-6 last:border-0">
            {Array.from({ length: 5 }).map((_, column) => (
              <div key={column} className={`h-5 rounded bg-slate-100 ${column === 0 ? "w-3/4" : "w-1/2"}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

async function ClientData({ user }: { user: Awaited<ReturnType<typeof requireUser>> }) {
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
      prisma.supplement.findMany({ where: { isActive: true }, orderBy: { id: "asc" } }),
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
    supplements: supplements.map((s) => ({ id: s.id, name: s.name, price: s.price.toString() })),
    photographers: photographers.map((p) => ({ id: p.id, name: p.name, phone: p.phone, isActive: p.isActive })),
    editors: editors.map((p) => ({ id: p.id, name: p.name, isActive: p.isActive })),
  };

  return <ClientManager clients={records} catalog={catalog} canManage={user.canManageClients} canExport={user.canManageUsers} />;
}

export default async function Home() {
  const user = await requireUser();
  if (!user.canViewClients)
    redirect(user.canManageUsers ? "/admin" : "/forbidden");

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <div className="min-w-0 flex-1">
        <MobileHeader />
        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8 sm:py-12">
          <Suspense fallback={<ClientListLoading />}>
            <ClientData user={user} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
