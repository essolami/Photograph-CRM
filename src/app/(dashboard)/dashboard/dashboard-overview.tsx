"use client";

import Link from "next/link";
import { useState } from "react";
import { projectStatuses } from "@/lib/client-data";
import { togeOptions } from "@/app/toges/options";

type Client = {
  id: number; name: string; defenseDate: string; createdAt: string;
  facultyName: string | null; packName: string | null; status: string;
  total: number; advance: number; discount: number; grossProfit: number;
  supplements: { name: string; price: number }[];
};
type Toge = {
  id: number; clientId: number | null; customerName: string; createdAt: string;
  element: string; color: string; size: string; location: string;
  price: number; advance: number; isDelivered: boolean;
};
type Task = {
  id: number; title: string; status: string; dueDate: string;
  createdAt: string; editorName: string;
};

const money = (value: number) => new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 0 }).format(value) + " DH";
const dateLabel = (value: string) => value ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)) : "Sans date";
const sum = <T,>(items: T[], get: (item: T) => number) => items.reduce((total, item) => total + get(item), 0);
const unique = (values: (string | null)[]) => [...new Set(values.filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b, "fr"));

function Distribution({ title, caption, rows, total, tone }: { title: string; caption: string; rows: { label: string; count: number }[]; total: number; tone: string }) {
  return <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <h2 className="text-lg font-extrabold text-slate-950">{title}</h2>
    <p className="mt-1 text-xs text-slate-500">{caption}</p>
    <div className="mt-6 space-y-4">
      {rows.filter((row) => row.count > 0).map((row) => <div key={row.label}>
        <div className="mb-1.5 flex justify-between gap-3 text-sm"><span className="truncate font-semibold text-slate-700">{row.label}</span><span className="font-extrabold tabular-nums text-slate-900">{row.count}</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${tone}`} style={{ width: `${total ? row.count / total * 100 : 0}%` }} /></div>
      </div>)}
      {!rows.some((row) => row.count > 0) && <p className="py-7 text-center text-sm text-slate-500">Aucune donnée pour ces filtres.</p>}
    </div>
  </section>;
}

export function DashboardOverview({ clients, toges, tasks }: { clients: Client[]; toges: Toge[]; tasks: Task[] }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [faculty, setFaculty] = useState("");
  const [pack, setPack] = useState("");
  const [clientStatus, setClientStatus] = useState("");
  const [togeLocation, setTogeLocation] = useState("");
  const [taskStatus, setTaskStatus] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeMonth, setActiveMonth] = useState("");
  const hasFilters = Boolean(from || to || faculty || pack || clientStatus || togeLocation || taskStatus);
  const inRange = (date: string) => (!from || date >= from) && (!to || date <= to);
  const filteredClients = clients.filter((row) =>
    inRange(row.createdAt) && (!faculty || row.facultyName === faculty)
    && (!pack || row.packName === pack) && (!clientStatus || row.status === clientStatus),
  );
  const filteredToges = toges.filter((row) => inRange(row.createdAt) && (!togeLocation || row.location === togeLocation));
  const filteredTasks = tasks.filter((row) => inRange(row.dueDate || row.createdAt) && (!taskStatus || row.status === taskStatus));
  const standaloneToges = filteredToges.filter((row) => row.clientId === null);
  const clientRevenue = sum(filteredClients, (row) => row.total);
  const togeRevenue = sum(standaloneToges, (row) => row.price);
  const collected = sum(filteredClients, (row) => row.advance) + sum(standaloneToges, (row) => row.advance);
  const outstanding = Math.max(0, clientRevenue + togeRevenue - collected);
  const delivered = filteredToges.filter((row) => row.isDelivered).length;
  const activeTasks = filteredTasks.filter((row) => !["Terminée", "Terminé", "Livré", "Annulé"].includes(row.status)).length;
  const supplementCounts = new Map<string, number>();
  for (const client of filteredClients) for (const item of client.supplements)
    supplementCounts.set(item.name, (supplementCounts.get(item.name) ?? 0) + 1);
  const supplementRows = [...supplementCounts].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
  const today = new Date().toISOString().slice(0, 10);
  const nextTasks = filteredTasks.filter((row) => !["Terminée", "Terminé", "Livré", "Annulé"].includes(row.status))
    .sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999")).slice(0, 5);
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - 5 + index, 1));
    const key = date.toISOString().slice(0, 7);
    return {
      key,
      label: new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "UTC" }).format(date),
      clients: filteredClients.filter((row) => row.createdAt.startsWith(key)),
      toges: standaloneToges.filter((row) => row.createdAt.startsWith(key)),
    };
  });
  const monthSales = months.map((month) => ({
    ...month,
    clientAmount: sum(month.clients, (row) => row.total),
    togeAmount: sum(month.toges, (row) => row.price),
  }));
  const maxMonth = Math.max(1, ...monthSales.map((month) => month.clientAmount + month.togeAmount));
  const displayedMonth = monthSales.find((month) => month.key === activeMonth) ?? monthSales[monthSales.length - 1];
  const cards = [
    { label: "Chiffre d’affaires", value: money(clientRevenue + togeRevenue), detail: "Clients + ventes de toges indépendantes", tone: "from-indigo-600 to-violet-600", light: false },
    { label: "Encaissé", value: money(collected), detail: "Avances enregistrées", tone: "bg-white", light: true },
    { label: "Le reste", value: money(outstanding), detail: "Montant restant à payer", tone: "bg-white", light: true },
    { label: "Gain brut clients", value: money(sum(filteredClients, (row) => row.grossProfit)), detail: "Valeurs saisies dans les dossiers", tone: "bg-white", light: true },
  ];
  const selectClass = "field mt-2 w-full";
  return <div className="max-w-7xl space-y-6 pb-10">
    <header className="flex flex-wrap items-end justify-between gap-5 border-b border-slate-200 pb-6">
      <div>
        <p className="text-[11px] font-bold tracking-[0.2em] text-indigo-600 uppercase">Vue d’ensemble</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Tableau de bord</h1>
        <p className="mt-2 text-sm text-slate-500">L’activité du studio, au même endroit.</p>
      </div>
      <p className="border-l-2 border-indigo-500 pl-3 text-sm font-semibold text-slate-600">{hasFilters ? "Résultats filtrés" : "Toutes les données"}</p>
    </header>

    <section aria-label="Filtres du tableau de bord" className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-3 px-4 py-4 sm:grid-cols-2 xl:grid-cols-4 sm:px-5">
        <label className="text-xs font-semibold text-slate-600">Du<input type="date" className={selectClass} value={from} max={to || undefined} onChange={(event) => setFrom(event.target.value)} /></label>
        <label className="text-xs font-semibold text-slate-600">Au<input type="date" className={selectClass} value={to} min={from || undefined} onChange={(event) => setTo(event.target.value)} /></label>
        <label className="text-xs font-semibold text-slate-600">Faculté · clients<select className={selectClass} value={faculty} onChange={(event) => setFaculty(event.target.value)}><option value="">Toutes les facultés</option>{unique(clients.map((row) => row.facultyName)).map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="text-xs font-semibold text-slate-600">Pack · clients<select className={selectClass} value={pack} onChange={(event) => setPack(event.target.value)}><option value="">Tous les packs</option>{unique(clients.map((row) => row.packName)).map((value) => <option key={value}>{value}</option>)}</select></label>
      </div>
      <div className="flex min-h-12 items-center justify-between gap-3 border-t border-slate-100 px-4 py-2 sm:px-5">
        <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-expanded={showFilters} aria-controls="dashboard-filters" onClick={() => setShowFilters((current) => !current)}>
          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${showFilters || hasFilters ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-700"}`}><svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2" strokeLinecap="round"><path d="M4 6h16M7 12h10M10 18h4" /></svg></span>
          <span className="text-sm font-bold text-slate-800">Autres filtres</span>
          <span className="truncate text-xs text-slate-500">Statuts et localisation</span>
        </button>
        {hasFilters && <button type="button" className="shrink-0 text-xs font-semibold text-indigo-700 hover:underline" onClick={() => { setFrom(""); setTo(""); setFaculty(""); setPack(""); setClientStatus(""); setTogeLocation(""); setTaskStatus(""); }}>Effacer</button>}
        <button type="button" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700" aria-label={showFilters ? "Masquer les filtres" : "Afficher les filtres"} aria-expanded={showFilters} aria-controls="dashboard-filters" onClick={() => setShowFilters((current) => !current)}><svg aria-hidden="true" viewBox="0 0 24 24" className={`h-4 w-4 fill-none stroke-current stroke-2 transition-transform ${showFilters ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg></button>
      </div>
      <div id="dashboard-filters" hidden={!showFilters} className="border-t border-slate-100 px-4 pb-5 pt-4 sm:px-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <label className="text-xs font-semibold text-slate-600">Statut · clients<select className={selectClass} value={clientStatus} onChange={(event) => setClientStatus(event.target.value)}><option value="">Tous les statuts</option>{unique([...projectStatuses, ...clients.map((row) => row.status)]).map((value) => <option key={value}>{value}</option>)}</select></label>
          <label className="text-xs font-semibold text-slate-600">Localisation · toges<select className={selectClass} value={togeLocation} onChange={(event) => setTogeLocation(event.target.value)}><option value="">Toutes les localisations</option>{togeOptions.locations.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label className="text-xs font-semibold text-slate-600">Statut · montage<select className={selectClass} value={taskStatus} onChange={(event) => setTaskStatus(event.target.value)}><option value="">Tous les statuts</option>{unique(tasks.map((row) => row.status)).map((value) => <option key={value}>{value}</option>)}</select></label>
        </div>
      </div>
    </section>

    <section aria-label="Indicateurs financiers" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map((card) => <article key={card.label} className={`rounded-2xl border p-5 ${card.light ? "border-slate-200 bg-white" : "border-[#252958] bg-[#252958] text-white"}`}><p className={`text-xs font-bold uppercase tracking-wider ${card.light ? "text-slate-500" : "text-indigo-100"}`}>{card.label}</p><p className="mt-5 text-2xl font-extrabold tracking-tight tabular-nums sm:text-3xl">{card.value}</p><p className={`mt-2 text-xs ${card.light ? "text-slate-500" : "text-indigo-100"}`}>{card.detail}</p></article>)}</section>

    <section aria-label="Activité" className="grid gap-4 sm:grid-cols-3">
      <Link href="/" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Dossiers clients</p><p className="mt-3 text-3xl font-extrabold text-slate-950">{filteredClients.length}</p><p className="mt-2 text-xs text-indigo-700">Voir les clients →</p></Link>
      <Link href="/toges" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Toges</p><p className="mt-3 text-3xl font-extrabold text-slate-950">{filteredToges.length}</p><p className="mt-2 text-xs text-slate-500">{delivered} livrées · {filteredToges.length - delivered} à livrer</p></Link>
      <Link href="/montage" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Tâches montage</p><p className="mt-3 text-3xl font-extrabold text-slate-950">{filteredTasks.length}</p><p className="mt-2 text-xs text-slate-500">{activeTasks} en cours</p></Link>
    </section>

    <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-extrabold text-slate-950">L’activité des 6 derniers mois</h2><p className="mt-1 text-xs text-slate-500">Montant des ventes par mois · survolez une barre pour le détail</p></div><div className="flex gap-4 text-xs font-semibold text-slate-600"><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-indigo-600" />Clients</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-amber-400" />Toges</span></div></div>
        <div className="mt-6 rounded-xl bg-slate-50 px-4 py-3"><span className="text-xs font-semibold capitalize text-slate-500">{displayedMonth.label} {displayedMonth.key.slice(0, 4)}</span><div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1"><strong className="text-xl font-extrabold tabular-nums text-slate-900">{money(displayedMonth.clientAmount + displayedMonth.togeAmount)}</strong><span className="text-xs text-slate-600">Clients {money(displayedMonth.clientAmount)} · Toges {money(displayedMonth.togeAmount)}</span></div></div>
        <div className="mt-5 grid grid-cols-6 gap-2 border-b border-slate-200 sm:gap-4">{monthSales.map((month) => <button key={month.key} type="button" className={`group flex min-w-0 flex-col items-center rounded-t-lg outline-none transition-colors hover:bg-indigo-50 focus-visible:bg-indigo-50 ${displayedMonth.key === month.key ? "bg-indigo-50/60" : ""}`} onMouseEnter={() => setActiveMonth(month.key)} onFocus={() => setActiveMonth(month.key)} onClick={() => setActiveMonth(month.key)} aria-label={`${month.label} ${month.key.slice(0, 4)} : ${money(month.clientAmount + month.togeAmount)} de ventes, dont ${money(month.clientAmount)} pour les clients et ${money(month.togeAmount)} pour les toges`}><span className="flex h-40 w-full max-w-20 items-end justify-center gap-1"><span className="w-1/2 min-w-1 rounded-t bg-indigo-600 transition-all group-hover:bg-indigo-700" style={{ height: `${month.clientAmount ? Math.max(5, month.clientAmount / maxMonth * 100) : 0}%` }} /><span className="w-1/2 min-w-1 rounded-t bg-amber-400 transition-all group-hover:bg-amber-500" style={{ height: `${month.togeAmount ? Math.max(5, month.togeAmount / maxMonth * 100) : 0}%` }} /></span><span className="py-3 text-xs font-semibold capitalize text-slate-500">{month.label}</span></button>)}</div>
        <p className="mt-3 text-xs text-slate-500">{sum(monthSales, (month) => month.clients.length)} dossiers clients · {sum(monthSales, (month) => month.toges.length)} ventes de toges indépendantes</p>
      </section>
      <Distribution title="Suppléments demandés" caption="Les plus choisis avec les dossiers affichés" rows={supplementRows.slice(0, 6)} total={Math.max(...supplementRows.map((row) => row.count), 0)} tone="bg-indigo-500" />
    </div>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-extrabold text-slate-950">Montage à suivre</h2><p className="mt-1 text-xs text-slate-500">Les prochaines tâches à traiter</p></div><Link href="/montage" className="text-xs font-bold text-indigo-700">Voir le montage →</Link></div>
      <div className="mt-4 grid gap-2 lg:grid-cols-2">{nextTasks.map((task) => <div key={task.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-800">{task.title}</p><p className="truncate text-xs text-slate-500">{task.editorName} · {task.status}</p></div><span className={`shrink-0 text-xs font-bold ${task.dueDate && task.dueDate < today ? "text-rose-600" : "text-slate-600"}`}>{task.dueDate ? dateLabel(task.dueDate) : "Sans échéance"}</span></div>)}{!nextTasks.length && <p className="py-6 text-sm text-slate-500">Aucune tâche à traiter dans cette sélection.</p>}</div>
    </section>

    <div className="grid gap-5 xl:grid-cols-2">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><h2 className="text-lg font-extrabold text-slate-950">Clients à suivre</h2><Link href="/" className="text-xs font-bold text-indigo-700">Tous les clients →</Link></div><p className="mt-1 text-xs text-slate-500">Prochaines soutenances dans la sélection</p><div className="mt-4 divide-y divide-slate-100">{filteredClients.filter((row) => row.defenseDate && row.defenseDate >= new Date().toISOString().slice(0, 10)).sort((a, b) => a.defenseDate.localeCompare(b.defenseDate)).slice(0, 5).map((row) => <div key={row.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-800">{row.name}</p><p className="truncate text-xs text-slate-500">{row.facultyName ?? "Faculté non renseignée"} · {row.status}</p></div><span className="shrink-0 text-xs font-semibold text-indigo-700">{dateLabel(row.defenseDate)}</span></div>)}{!filteredClients.some((row) => row.defenseDate && row.defenseDate >= new Date().toISOString().slice(0, 10)) && <p className="py-8 text-center text-sm text-slate-500">Aucune soutenance à venir.</p>}</div></section>
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><h2 className="text-lg font-extrabold text-slate-950">Toges à livrer</h2><Link href="/toges" className="text-xs font-bold text-indigo-700">Toutes les toges →</Link></div><p className="mt-1 text-xs text-slate-500">Ventes sélectionnées non livrées</p><div className="mt-4 divide-y divide-slate-100">{filteredToges.filter((row) => !row.isDelivered).slice(0, 5).map((row) => <div key={row.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-800">{row.customerName}</p><p className="truncate text-xs text-slate-500">{row.element} · {row.color} · {row.size}</p></div><span className="shrink-0 text-xs font-semibold text-slate-600">{row.location}</span></div>)}{filteredToges.every((row) => row.isDelivered) && <p className="py-8 text-center text-sm text-slate-500">Aucune toge à livrer.</p>}</div></section>
    </div>
  </div>;
}
