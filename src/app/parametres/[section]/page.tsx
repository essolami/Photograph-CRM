import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { sections, type Section } from "../config";
import { SettingsTable } from "../settings-table";
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
  const rates =
    section === "packs"
      ? await prisma.facultyPackRate.findMany({
          include: { faculty: true },
          orderBy: { id: "asc" },
        })
      : [];
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
  const records = await (section === "packs"
    ? prisma.pack.findMany({ orderBy: { id: "asc" } })
    : section === "supplements"
      ? prisma.supplement.findMany({ orderBy: { id: "asc" } })
      : section === "photographes"
        ? prisma.photographer.findMany({ orderBy: { id: "asc" } })
        : prisma.editor.findMany({ orderBy: { id: "asc" } }));
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
      <SettingsTable
        key={section}
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
    </section>
  );
}
