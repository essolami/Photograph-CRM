import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { sections, type Section } from "../config";
import { SettingsTable } from "../settings-table";

const getSettingsData = unstable_cache(
  async (section: Section) => {
    const rates =
      section === "packs"
        ? await prisma.facultyPackRate.findMany({
            include: { faculty: true },
            orderBy: { id: "asc" },
          })
        : [];
    const records = await (section === "packs"
      ? prisma.pack.findMany({ orderBy: { id: "asc" } })
      : section === "supplements"
        ? prisma.supplement.findMany({ orderBy: { id: "asc" } })
        : section === "photographes"
          ? prisma.photographer.findMany({ orderBy: { id: "asc" } })
          : prisma.editor.findMany({ orderBy: { id: "asc" } }));
    return { rates, records };
  },
  ["settings-data"],
  { revalidate: 300, tags: ["settings"] },
);

function SettingsTableLoading() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="h-14 border-b border-slate-200 bg-indigo-50/70" />
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex gap-6 border-b border-slate-100 p-5 last:border-0">
          <div className="h-5 w-1/3 rounded bg-slate-100" />
          <div className="h-5 w-1/4 rounded bg-slate-100" />
          <div className="ml-auto h-8 w-20 rounded-lg bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

async function SettingsData({ section }: { section: Section }) {
  const { rates, records } = await getSettingsData(section);
  const priceRows = (id?: number) =>
    rates
      .filter((rate) => rate.packId === id)
      .map((rate) => ({
        id: rate.facultyId,
        name: rate.faculty.name,
        isActive: rate.faculty.isActive,
        soloPrice: rate.soloPrice.toString(),
        duoPrice: rate.duoPrice.toString(),
      }));
  return (
    <SettingsTable
      section={section}
      newPriceRows={priceRows()}
      records={records.map((r) => ({
        id: r.id,
        name: r.name,
        phone: "phone" in r && typeof r.phone === "string" ? r.phone : null,
        isActive: r.isActive,
        price: "price" in r ? String(r.price) : undefined,
        priceRows: priceRows(r.id),
      }))}
    />
  );
}

export default async function SettingsSection({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  await requirePermission("canManageUsers");
  const { section: key } = await params;
  if (key === "tarifs" || key === "facultes") redirect("/parametres/packs");
  if (!Object.hasOwn(sections, key)) notFound();
  const section = key as Section;
  const config = sections[section];
  return (
    <section>
      <p className="mb-2 text-[11px] font-semibold tracking-[0.16em] text-indigo-500 uppercase">
        Configuration du studio
      </p>
      <h1 className="text-3xl font-bold text-slate-950 sm:text-4xl">
        {config.title}
      </h1>
      <p className="mt-3 mb-8 max-w-2xl text-sm leading-6 text-slate-500">
        {config.description}
      </p>
      <Suspense fallback={<SettingsTableLoading />}>
        <SettingsData section={section} />
      </Suspense>
    </section>
  );
}
