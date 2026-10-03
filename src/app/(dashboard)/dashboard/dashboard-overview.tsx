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
  defenseDate: string; element: string; color: string; size: string; location: string;
  // `price` est déjà net de réduction.
  price: number; discount: number; advance: number; isDelivered: boolean;
};
type Task = {
  id: number; title: string; status: string; dueDate: string;
  createdAt: string; editorName: string;
};
const money = (value: number) => new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 0 }).format(value) + " DH";
const dateLabel = (value: string) => value ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)) : "Sans date";
const monthKey = (value: string) => value.slice(0, 7);
const addMonths = (count: number) => new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() + count, 1));
const sum = <T,>(items: T[], get: (item: T) => number) => items.reduce((total, item) => total + get(item), 0);
const unique = (values: (string | null)[]) => [...new Set(values.filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b, "fr"));
const closedTask = (status: string) => ["Terminée", "Terminé", "Livré", "Annulé"].includes(status);

function Distribution({ title, caption, rows, tone }: { title: string; caption: string; rows: { label: string; count: number }[]; tone: string }) {
  const max = Math.max(...rows.map((row) => row.count), 0);
  return <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <h2 className="text-lg font-extrabold text-slate-950">{title}</h2>
    <p className="mt-1 text-xs text-slate-500">{caption}</p>
    <div className="mt-6 space-y-4">
      {rows.filter((row) => row.count > 0).map((row) => <div key={row.label}>
        <div className="mb-1.5 flex justify-between gap-3 text-sm"><span className="truncate font-semibold text-slate-700">{row.label}</span><span className="font-extrabold tabular-nums text-slate-900">{row.count}</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${tone}`} style={{ width: `${max ? row.count / max * 100 : 0}%` }} /></div>
      </div>)}
      {!rows.some((row) => row.count > 0) && <p className="py-7 text-center text-sm text-slate-500">Aucune donnée pour ces filtres.</p>}
    </div>
  </section>;
}

function Metric({ label, value, detail, strong = false }: { label: string; value: string; detail?: string; strong?: boolean }) {
  return <div className="rounded-xl bg-slate-50 px-4 py-3">
    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
    <p className={`mt-1.5 font-extrabold tabular-nums text-slate-950 ${strong ? "text-2xl" : "text-xl"}`}>{value}</p>
    {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
  </div>;
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
  const today = new Date().toISOString().slice(0, 10);
  const hasFilters = Boolean(from || to || faculty || pack || clientStatus || togeLocation || taskStatus);

  // The soutenance date is what the studio plans around, so it drives every
  // filter. Falling back to the creation date keeps rows without a soutenance
  // date visible instead of silently dropping them.
  const clientDate = (row: Client) => row.defenseDate || row.createdAt;
  const togeDate = (row: Toge) => row.defenseDate || row.createdAt;
  const taskDate = (row: Task) => row.dueDate || row.createdAt;
  const inRange = (date: string) => (!from || date >= from) && (!to || date <= to);

  const filteredClients = clients.filter((row) =>
    inRange(clientDate(row)) && (!faculty || row.facultyName === faculty)
    && (!pack || row.packName === pack) && (!clientStatus || row.status === clientStatus),
  );
  const filteredToges = toges.filter((row) => inRange(togeDate(row)) && (!togeLocation || (togeLocation === "none" ? !row.location : row.location === togeLocation)));
  const filteredTasks = tasks.filter((row) => inRange(taskDate(row)) && (!taskStatus || row.status === taskStatus));

  // Réservations : les toges vendues dans un dossier client sont déjà
  // facturées dans le total du dossier (supplément). On ne les compte donc
  // qu'une seule fois, du côté réservations.
  const reservationRevenue = sum(filteredClients, (row) => row.total);
  const reservationCollected = sum(filteredClients, (row) => row.advance);
  const reservationOutstanding = Math.max(0, reservationRevenue - reservationCollected);
  const reservationProfit = sum(filteredClients, (row) => row.grossProfit);
  const reservationDiscount = sum(filteredClients, (row) => row.discount);
  const paidClients = filteredClients.filter((row) => row.advance >= row.total).length;

  const linkedToges = filteredToges.filter((row) => row.clientId !== null);
  const standaloneToges = filteredToges.filter((row) => row.clientId === null);
  const togeRevenue = sum(standaloneToges, (row) => row.price);
  const togeCollected = sum(standaloneToges, (row) => row.advance);
  const togeOutstanding = Math.max(0, togeRevenue - togeCollected);
  const deliveredToges = filteredToges.filter((row) => row.isDelivered).length;
  const paidToges = standaloneToges.filter((row) => row.advance >= row.price).length;
  const linkedTogeValue = sum(linkedToges, (row) => row.price);
  const togeDiscount = sum(standaloneToges, (row) => row.discount);

  const totalRevenue = reservationRevenue + togeRevenue;
  const totalCollected = reservationCollected + togeCollected;
  const totalOutstanding = Math.max(0, totalRevenue - totalCollected);
  const activeTasks = filteredTasks.filter((row) => !closedTask(row.status)).length;

  const countBy = <T,>(items: T[], get: (item: T) => string) => {
    const counts = new Map<string, number>();
    for (const item of items) counts.set(get(item), (counts.get(get(item)) ?? 0) + 1);
    return [...counts].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
  };
  const supplementCounts = new Map<string, number>();
  for (const client of filteredClients) for (const item of client.supplements)
    supplementCounts.set(item.name, (supplementCounts.get(item.name) ?? 0) + 1);
  const supplementRows = [...supplementCounts].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
  const togeElementRows = countBy(filteredToges, (row) => row.element);

  // La fenêtre du graphique suit la période filtrée et laisse voir les mois à
  // venir, puisque les soutenances sont planifiées à l'avance.
  const windowStart = from ? `${monthKey(from)}-01` : `${monthKey(addMonths(-3).toISOString())}-01`;
  const windowEnd = to ? `${monthKey(to)}-01` : `${monthKey(addMonths(2).toISOString())}-01`;
  const monthSpan = Math.min(12, Math.max(1,
    (Number(windowEnd.slice(0, 4)) - Number(windowStart.slice(0, 4))) * 12
    + Number(windowEnd.slice(5, 7)) - Number(windowStart.slice(5, 7)) + 1));
  const monthSales = Array.from({ length: monthSpan }, (_, index) => {
    const date = new Date(Date.UTC(Number(windowStart.slice(0, 4)), Number(windowStart.slice(5, 7)) - 1 + index, 1));
    const key = date.toISOString().slice(0, 7);
    const monthClients = filteredClients.filter((row) => clientDate(row).startsWith(key));
    const monthToges = standaloneToges.filter((row) => togeDate(row).startsWith(key));
    return {
      key,
      label: new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "UTC" }).format(date),
      year: key.slice(0, 4),
      clients: monthClients,
      toges: monthToges,
      clientAmount: sum(monthClients, (row) => row.total),
      togeAmount: sum(monthToges, (row) => row.price),
    };
  });
  const maxMonth = Math.max(1, ...monthSales.map((month) => month.clientAmount + month.togeAmount));
  const displayedMonth = monthSales.find((month) => month.key === activeMonth)
    ?? monthSales.find((month) => month.key === today.slice(0, 7))
    ?? monthSales[monthSales.length - 1];

  const upcomingClients = filteredClients.filter((row) => row.defenseDate && row.defenseDate >= today)
    .sort((a, b) => a.defenseDate.localeCompare(b.defenseDate));
  const nextTasks = filteredTasks.filter((row) => !closedTask(row.status))
    .sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999")).slice(0, 5);
  const selectClass = "field mt-2 w-full";
  // Les raccourcis se calculent au clic : la date du jour ne doit pas être lue
  // pendant le rendu.
  const applyPreset = (label: "Ce mois" | "30 prochains jours" | "Mois prochain") => {
    const now = new Date();
    const firstOf = (offset: number) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1));
    const lastOf = (offset: number) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset + 1, 0));
    const day = (date: Date) => date.toISOString().slice(0, 10);
    if (label === "Ce mois") { setFrom(day(firstOf(0))); setTo(day(lastOf(0))); return; }
    if (label === "Mois prochain") { setFrom(day(firstOf(1))); setTo(day(lastOf(1))); return; }
    setFrom(day(now));
    setTo(day(new Date(now.getTime() + 30 * 86400000)));
  };

  return <div className="max-w-7xl space-y-6 pb-10">
    <header className="flex flex-wrap items-end justify-between gap-5 border-b border-slate-200 pb-6">
      <div>
        <p className="text-[11px] font-bold tracking-[0.2em] text-indigo-600 uppercase">Vue d’ensemble</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Tableau de bord</h1>
        <p className="mt-2 text-sm text-slate-500">Réservations et toges comptées séparément, par date de soutenance.</p>
      </div>
      <p className="border-l-2 border-indigo-500 pl-3 text-sm font-semibold text-slate-600">{hasFilters ? "Résultats filtrés" : "Toutes les données"}</p>
    </header>

    <section aria-label="Filtres du tableau de bord" className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Période · date de soutenance</span>
        <span className="text-xs text-slate-500">Les soutenances et ventes à venir sont incluses.</span>
      </div>
      <div className="grid gap-3 px-4 py-4 sm:grid-cols-2 xl:grid-cols-4 sm:px-5">
        <label className="text-xs font-semibold text-slate-600">Du<input type="date" className={selectClass} value={from} max={to || undefined} onChange={(event) => setFrom(event.target.value)} /></label>
        <label className="text-xs font-semibold text-slate-600">Au<input type="date" className={selectClass} value={to} min={from || undefined} onChange={(event) => setTo(event.target.value)} /></label>
        <label className="text-xs font-semibold text-slate-600">Faculté · clients<select className={selectClass} value={faculty} onChange={(event) => setFaculty(event.target.value)}><option value="">Toutes les facultés</option>{unique(clients.map((row) => row.facultyName)).map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="text-xs font-semibold text-slate-600">Pack · clients<select className={selectClass} value={pack} onChange={(event) => setPack(event.target.value)}><option value="">Tous les packs</option>{unique(clients.map((row) => row.packName)).map((value) => <option key={value}>{value}</option>)}</select></label>
      </div>
      <div className="flex flex-wrap items-center gap-2 px-4 pb-4 sm:px-5">
        {(["Ce mois", "30 prochains jours", "Mois prochain"] as const).map((label) =>
          <button key={label} type="button" onClick={() => applyPreset(label)}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-indigo-300 hover:text-indigo-700">{label}</button>)}
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
          <label className="text-xs font-semibold text-slate-600">Localisation · toges<select className={selectClass} value={togeLocation} onChange={(event) => setTogeLocation(event.target.value)}><option value="">Toutes les localisations</option><option value="none">Non renseignée</option>{togeOptions.locations.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label className="text-xs font-semibold text-slate-600">Statut · montage<select className={selectClass} value={taskStatus} onChange={(event) => setTaskStatus(event.target.value)}><option value="">Tous les statuts</option>{unique(tasks.map((row) => row.status)).map((value) => <option key={value}>{value}</option>)}</select></label>
        </div>
      </div>
    </section>

    <section aria-label="Total général" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <article className="rounded-2xl border border-[#252958] bg-[#252958] p-5 text-white">
        <p className="text-xs font-bold uppercase tracking-wider text-indigo-100">Chiffre d’affaires total</p>
        <p className="mt-5 text-2xl font-extrabold tracking-tight tabular-nums sm:text-3xl">{money(totalRevenue)}</p>
        <p className="mt-2 text-xs text-indigo-100">Réservations {money(reservationRevenue)} · Toges {money(togeRevenue)}</p>
      </article>
      <article className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Encaissé</p>
        <p className="mt-5 text-2xl font-extrabold tracking-tight tabular-nums sm:text-3xl">{money(totalCollected)}</p>
        <p className="mt-2 text-xs text-slate-500">{totalRevenue ? Math.round(totalCollected / totalRevenue * 100) : 0} % du chiffre d’affaires</p>
      </article>
      <article className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Le reste</p>
        <p className="mt-5 text-2xl font-extrabold tracking-tight tabular-nums text-rose-600 sm:text-3xl">{money(totalOutstanding)}</p>
        <p className="mt-2 text-xs text-slate-500">Réservations {money(reservationOutstanding)} · Toges {money(togeOutstanding)}</p>
      </article>
      <article className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Gain brut clients</p>
        <p className="mt-5 text-2xl font-extrabold tracking-tight tabular-nums sm:text-3xl">{money(reservationProfit)}</p>
        <p className="mt-2 text-xs text-slate-500">Valeurs saisies dans les dossiers</p>
      </article>
    </section>

    <div className="grid gap-5 xl:grid-cols-2">
      <section aria-label="Réservations" className="rounded-3xl border border-indigo-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-600">Réservations seules</p>
            <h2 className="mt-1 text-xl font-extrabold text-slate-950">{filteredClients.length} dossier{filteredClients.length > 1 ? "s" : ""} client{filteredClients.length > 1 ? "s" : ""}</h2>
          </div>
          <Link href="/" className="text-xs font-bold text-indigo-700">Voir les clients →</Link>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Metric label="Chiffre d’affaires" value={money(reservationRevenue)} strong />
          <Metric label="Encaissé" value={money(reservationCollected)} detail={`${paidClients} dossier${paidClients > 1 ? "s" : ""} soldé${paidClients > 1 ? "s" : ""}`} />
          <Metric label="Le reste" value={money(reservationOutstanding)} detail={`${filteredClients.length - paidClients} à encaisser`} />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Metric label="Panier moyen" value={filteredClients.length ? money(reservationRevenue / filteredClients.length) : "—"} />
          <Metric label="Réductions" value={money(reservationDiscount)} />
          <Metric label="Soutenances à venir" value={String(upcomingClients.length)} detail={upcomingClients[0] ? `Prochaine le ${dateLabel(upcomingClients[0].defenseDate)}` : "Aucune"} />
        </div>
        <p className="mt-4 text-xs text-slate-500">Les toges vendues dans un dossier sont facturées ici en supplément ({linkedToges.length} vente{linkedToges.length > 1 ? "s" : ""} · {money(linkedTogeValue)}).</p>
      </section>

      <section aria-label="Toges" className="rounded-3xl border border-amber-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-600">Toges seules</p>
            <h2 className="mt-1 text-xl font-extrabold text-slate-950">{standaloneToges.length} vente{standaloneToges.length > 1 ? "s" : ""} indépendante{standaloneToges.length > 1 ? "s" : ""}</h2>
          </div>
          <Link href="/toges" className="text-xs font-bold text-amber-700">Voir les toges →</Link>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Metric label="Chiffre d’affaires" value={money(togeRevenue)} strong />
          <Metric label="Encaissé" value={money(togeCollected)} detail={`${paidToges} vente${paidToges > 1 ? "s" : ""} soldée${paidToges > 1 ? "s" : ""}`} />
          <Metric label="Le reste" value={money(togeOutstanding)} detail={`${standaloneToges.length - paidToges} à encaisser`} />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Metric label="Prix moyen" value={standaloneToges.length ? money(togeRevenue / standaloneToges.length) : "—"} />
          <Metric label="Livrées" value={`${deliveredToges} / ${filteredToges.length}`} detail="Toutes les toges de la période" />
          <Metric label="À livrer" value={String(filteredToges.length - deliveredToges)} detail={`dont ${linkedToges.filter((row) => !row.isDelivered).length} liée(s) à un dossier`} />
        </div>
        <p className="mt-4 text-xs text-slate-500">Montants nets de réduction{togeDiscount > 0 ? ` (${money(togeDiscount)} de réductions accordées)` : ""}. Le chiffre d’affaires toges ne compte que les ventes hors dossier, pour éviter de compter deux fois les toges facturées en supplément.</p>
      </section>
    </div>

    <section aria-label="Activité" className="grid gap-4 sm:grid-cols-3">
      <Link href="/" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Dossiers clients</p><p className="mt-3 text-3xl font-extrabold text-slate-950">{filteredClients.length}</p><p className="mt-2 text-xs text-indigo-700">Voir les clients →</p></Link>
      <Link href="/toges" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Toges</p><p className="mt-3 text-3xl font-extrabold text-slate-950">{filteredToges.length}</p><p className="mt-2 text-xs text-slate-500">{deliveredToges} livrées · {filteredToges.length - deliveredToges} à livrer</p></Link>
      <Link href="/montage" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Tâches montage</p><p className="mt-3 text-3xl font-extrabold text-slate-950">{filteredTasks.length}</p><p className="mt-2 text-xs text-slate-500">{activeTasks} en cours</p></Link>
    </section>

    <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-extrabold text-slate-950">L’activité mois par mois</h2><p className="mt-1 text-xs text-slate-500">Par date de soutenance · survolez une barre pour le détail</p></div><div className="flex gap-4 text-xs font-semibold text-slate-600"><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-indigo-600" />Réservations</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-amber-400" />Toges</span></div></div>
        <div className="mt-6 rounded-xl bg-slate-50 px-4 py-3"><span className="text-xs font-semibold capitalize text-slate-500">{displayedMonth.label} {displayedMonth.year}</span><div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1"><strong className="text-xl font-extrabold tabular-nums text-slate-900">{money(displayedMonth.clientAmount + displayedMonth.togeAmount)}</strong><span className="text-xs text-slate-600">Réservations {money(displayedMonth.clientAmount)} ({displayedMonth.clients.length}) · Toges {money(displayedMonth.togeAmount)} ({displayedMonth.toges.length})</span></div></div>
        <div className="mt-5 flex gap-2 border-b border-slate-200 sm:gap-4">{monthSales.map((month) => <button key={month.key} type="button" className={`group flex min-w-0 flex-1 flex-col items-center rounded-t-lg outline-none transition-colors hover:bg-indigo-50 focus-visible:bg-indigo-50 ${displayedMonth.key === month.key ? "bg-indigo-50/60" : ""} ${month.key > today.slice(0, 7) ? "opacity-90" : ""}`} onMouseEnter={() => setActiveMonth(month.key)} onFocus={() => setActiveMonth(month.key)} onClick={() => setActiveMonth(month.key)} aria-label={`${month.label} ${month.year} : ${money(month.clientAmount + month.togeAmount)} de ventes, dont ${money(month.clientAmount)} de réservations et ${money(month.togeAmount)} de toges`}><span className="flex h-40 w-full max-w-20 items-end justify-center gap-1"><span className="w-1/2 min-w-1 rounded-t bg-indigo-600 transition-all group-hover:bg-indigo-700" style={{ height: `${month.clientAmount ? Math.max(5, month.clientAmount / maxMonth * 100) : 0}%` }} /><span className="w-1/2 min-w-1 rounded-t bg-amber-400 transition-all group-hover:bg-amber-500" style={{ height: `${month.togeAmount ? Math.max(5, month.togeAmount / maxMonth * 100) : 0}%` }} /></span><span className="py-3 text-xs font-semibold capitalize text-slate-500">{month.label}{month.key.slice(0, 4) !== today.slice(0, 4) ? ` ${month.year.slice(2)}` : ""}</span></button>)}</div>
        <p className="mt-3 text-xs text-slate-500">{sum(monthSales, (month) => month.clients.length)} dossiers clients · {sum(monthSales, (month) => month.toges.length)} ventes de toges indépendantes sur la fenêtre affichée</p>
      </section>
      <div className="space-y-5">
        <Distribution title="Suppléments demandés" caption="Les plus choisis dans les dossiers affichés" rows={supplementRows.slice(0, 6)} tone="bg-indigo-500" />
        <Distribution title="Éléments de toges" caption="Répartition des ventes de la période" rows={togeElementRows.slice(0, 6)} tone="bg-amber-400" />
      </div>
    </div>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-extrabold text-slate-950">Montage à suivre</h2><p className="mt-1 text-xs text-slate-500">Les prochaines tâches à traiter</p></div><Link href="/montage" className="text-xs font-bold text-indigo-700">Voir le montage →</Link></div>
      <div className="mt-4 grid gap-2 lg:grid-cols-2">{nextTasks.map((task) => <div key={task.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-800">{task.title}</p><p className="truncate text-xs text-slate-500">{task.editorName} · {task.status}</p></div><span className={`shrink-0 text-xs font-bold ${task.dueDate && task.dueDate < today ? "text-rose-600" : "text-slate-600"}`}>{task.dueDate ? dateLabel(task.dueDate) : "Sans échéance"}</span></div>)}{!nextTasks.length && <p className="py-6 text-sm text-slate-500">Aucune tâche à traiter dans cette sélection.</p>}</div>
    </section>

    <div className="grid gap-5 xl:grid-cols-2">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><h2 className="text-lg font-extrabold text-slate-950">Clients à suivre</h2><Link href="/" className="text-xs font-bold text-indigo-700">Tous les clients →</Link></div><p className="mt-1 text-xs text-slate-500">Prochaines soutenances dans la sélection</p><div className="mt-4 divide-y divide-slate-100">{upcomingClients.slice(0, 5).map((row) => <div key={row.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-800">{row.name}</p><p className="truncate text-xs text-slate-500">{row.facultyName ?? "Faculté non renseignée"} · {row.status} · reste {money(Math.max(0, row.total - row.advance))}</p></div><span className="shrink-0 text-xs font-semibold text-indigo-700">{dateLabel(row.defenseDate)}</span></div>)}{!upcomingClients.length && <p className="py-8 text-center text-sm text-slate-500">Aucune soutenance à venir.</p>}</div></section>
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><h2 className="text-lg font-extrabold text-slate-950">Toges à livrer</h2><Link href="/toges" className="text-xs font-bold text-indigo-700">Toutes les toges →</Link></div><p className="mt-1 text-xs text-slate-500">Ventes sélectionnées non livrées</p><div className="mt-4 divide-y divide-slate-100">{filteredToges.filter((row) => !row.isDelivered).slice(0, 5).map((row) => <div key={row.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-800">{row.customerName}{row.clientId !== null ? " · dossier" : ""}</p><p className="truncate text-xs text-slate-500">{row.element} · {row.color} · {row.size}</p></div><span className="shrink-0 text-xs font-semibold text-slate-600">{row.location || "—"}</span></div>)}{filteredToges.every((row) => row.isDelivered) && <p className="py-8 text-center text-sm text-slate-500">Aucune toge à livrer.</p>}</div></section>
    </div>
  </div>;
}
