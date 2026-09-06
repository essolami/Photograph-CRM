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
    <div>
      <p className="mb-2 text-[11px] font-semibold tracking-[0.16em] text-indigo-500 uppercase">
        Gestion du studio
      </p>
      <h1 className="text-3xl font-bold sm:text-4xl">Clients</h1>
      <p className="mt-3 mb-8 text-sm text-slate-500">
        Retrouvez vos soutenances, vos prestations et l’avancement de chaque dossier.
      </p>
      <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="h-10 min-w-64 flex-1 rounded-lg border border-slate-200 bg-white" />
          <div className="h-10 w-36 rounded-xl border border-slate-200 bg-white" />
          <div className="h-10 w-32 rounded-xl border border-slate-200 bg-white" />
          <div className="h-10 w-36 rounded-lg bg-indigo-600/20" />
        </div>
      </div>
      <div className="mb-3 h-5 w-32 rounded bg-slate-100" />
      <div className="overflow-x-auto rounded-2xl border border-indigo-100 bg-white shadow-[0_8px_30px_rgba(79,70,229,0.06)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-indigo-100 bg-indigo-50/80">
            <tr>
              {Array.from({ length: 7 }).map((_, index) => (
                <th key={index} className="px-4 py-3">
                  <div className="h-4 w-20 animate-pulse rounded bg-indigo-100" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 4 }).map((_, row) => (
              <tr key={row} className="border-b border-slate-100">
                {Array.from({ length: 7 }).map((_, column) => (
                  <td key={column} className="px-4 py-6">
                    <div className={`h-5 animate-pulse rounded bg-slate-100 ${column === 0 ? "w-32" : "w-20"}`} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Keep the loading state inside the table while Neon responds. */}
      <div className="sr-only" aria-live="polite">Chargement des clients…</div>
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
