import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

const money = (value: number) =>
  new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value) + " DH";

const supplementLabels = [
  ["Toge", "🎓"],
  ["Perso toge", "✏️"],
  ["Tableau", "🖼️"],
  ["Miroir", "🪞"],
  ["Album", "📚"],
  ["Photobook", "📘"],
  ["Déco", "🎈"],
  ["Roll UP", "📦"],
  ["Cadeau", "🎁"],
] as const;

function number(value: unknown) {
  return typeof value === "number" ? value : Number(value ?? 0);
}

export default async function DashboardPage() {
  const user = await requireUser();
  if (!user.canManageClients && !user.canManageUsers) redirect("/forbidden");

  const clients = await prisma.client.findMany({
    select: {
      total: true,
      advance: true,
      discount: true,
      grossProfit: true,
      status: true,
      supplements: true,
    },
  });

  const totals = clients.reduce(
    (result, client) => {
      result.revenue += number(client.total);
      result.advance += number(client.advance);
      result.discount += number(client.discount);
      result.grossProfit += number(client.grossProfit);
      return result;
    },
    { revenue: 0, advance: 0, discount: 0, grossProfit: 0 },
  );

  const supplements = new Map<string, { count: number; amount: number }>();
  for (const client of clients) {
    const choices = Array.isArray(client.supplements) ? client.supplements : [];
    for (const choice of choices) {
      if (!choice || typeof choice !== "object") continue;
      const item = choice as { name?: unknown; price?: unknown };
      const name = String(item.name ?? "Supplément");
      const current = supplements.get(name) ?? { count: 0, amount: 0 };
      current.count += 1;
      current.amount += number(item.price);
      supplements.set(name, current);
    }
  }

  const statuses = clients.reduce<Record<string, number>>((result, client) => {
    result[client.status] = (result[client.status] ?? 0) + 1;
    return result;
  }, {});

  const statCards = [
    { icon: "🧮", label: "Nombre total de soutenances", value: String(clients.length), tone: "bg-indigo-50 text-indigo-700" },
    { icon: "💰", label: "Chiffre d’affaires total", value: money(totals.revenue), tone: "bg-violet-50 text-violet-700" },
    { icon: "💳", label: "Avances encaissées", value: money(totals.advance), tone: "bg-emerald-50 text-emerald-700" },
    { icon: "🧾", label: "Réductions accordées", value: money(totals.discount), tone: "bg-amber-50 text-amber-700" },
    { icon: "📈", label: "Gain brut", value: money(totals.grossProfit), tone: "bg-blue-50 text-blue-700" },
  ];

  return (
    <div className="max-w-7xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-indigo-600 uppercase">Pilotage</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Tableau de bord</h1>
          <p className="mt-2 text-sm text-slate-500">Une vue globale de l’activité du studio.</p>
        </div>
        <div className="rounded-xl border border-indigo-100 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
          Toutes les périodes
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {statCards.map((stat) => (
          <article key={stat.label} className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-[0_8px_30px_rgba(79,70,229,0.06)]">
            <div className="flex items-start justify-between gap-3">
              <span className="text-2xl" aria-hidden="true">{stat.icon}</span>
              <span className={`rounded-full px-2 py-1 text-[10px] font-bold tracking-wide uppercase ${stat.tone}`}>Global</span>
            </div>
            <p className="mt-5 text-xs font-semibold leading-5 text-slate-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">{stat.value}</p>
          </article>
        ))}
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-[0_8px_30px_rgba(79,70,229,0.06)]">
          <div className="border-b border-indigo-100 bg-indigo-50/70 px-5 py-4">
            <h2 className="font-extrabold text-slate-950">📌 Suppléments vendus</h2>
            <p className="mt-1 text-xs text-slate-500">Le détail sera filtrable par période et faculté.</p>
          </div>
          <div className="divide-y divide-slate-100">
            {supplementLabels.map(([label, icon]) => {
              const item = [...supplements.entries()].find(([name]) => name.toLocaleLowerCase() === label.toLocaleLowerCase())?.[1];
              return <div key={label} className="flex items-center justify-between px-5 py-3"><span className="flex items-center gap-2 text-sm font-semibold text-slate-700"><span>{icon}</span>{label}</span><span className="text-sm font-extrabold text-slate-950">{item?.count ?? 0}</span></div>;
            })}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-[0_8px_30px_rgba(79,70,229,0.06)]">
          <div className="border-b border-indigo-100 bg-indigo-50/70 px-5 py-4">
            <h2 className="font-extrabold text-slate-950">📊 Projets par statut</h2>
            <p className="mt-1 text-xs text-slate-500">Suivi de l’avancement de vos dossiers.</p>
          </div>
          <div className="divide-y divide-slate-100">
            {["En cours", "À photographier", "En montage", "Terminé", "Livré", "Annulé"].map((status) => <div key={status} className="flex items-center justify-between px-5 py-3"><span className="text-sm font-semibold text-slate-700">{status}</span><span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-extrabold text-indigo-700">{statuses[status] ?? 0}</span></div>)}
          </div>
        </section>
      </div>
    </div>
  );
}
