"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { deleteToge, fetchTogesPage, updateTogeDelivered } from "./actions";
import { SettingsDrawer } from "../(dashboard)/parametres/settings-drawer";
import { Pagination } from "../pagination";
import { TogeForm, type TogeRecord } from "./toge-form";
import { emptyTogeFilters, togeOptions, type TogeFilters } from "./options";
import { PAGE_SIZE } from "@/lib/client-data";

const money = (value: string) => new Intl.NumberFormat("fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value)) + " DH";
// La réduction est retirée du prix catalogue : c'est le net qui est dû.
const netPrice = (row: TogeRecord) => Math.max(0, Number(row.price) - Number(row.discount || 0));
const remaining = (row: TogeRecord) => Math.max(0, netPrice(row) - Number(row.advance));

export function TogeManager({ initialRows, initialTotal }: { initialRows: TogeRecord[]; initialTotal: number }) {
  const [rows, setRows] = useState(initialRows);
  const [total, setTotal] = useState(initialTotal);
  const [filters, setFilters] = useState(emptyTogeFilters);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [drawer, setDrawer] = useState<TogeRecord | "new" | null>(null);
  const [pending, startTransition] = useTransition();
  const requestKey = JSON.stringify([filters, page]);
  const latestRequest = useRef(requestKey);
  // Clé des données actuellement affichées : la première page vient du serveur.
  const loadedKey = useRef(requestKey);
  const reload = useCallback(async (nextFilters: TogeFilters, nextPage: number) => {
    const key = JSON.stringify([nextFilters, nextPage]);
    latestRequest.current = key;
    setLoading(true);
    try {
      const result = await fetchTogesPage(nextFilters, nextPage);
      // Une r\u00e9ponse plus ancienne ne doit pas \u00e9craser la derni\u00e8re demande.
      if (latestRequest.current !== key) return;
      setRows(result.rows);
      setTotal(result.total);
      setError("");
    } catch {
      if (latestRequest.current === key) setError("Impossible de charger les ventes. R\u00e9essayez.");
    } finally {
      if (latestRequest.current === key) setLoading(false);
    }
  }, []);
  useEffect(() => {
    // Recharger d\u00e8s que la demande diff\u00e8re des donn\u00e9es affich\u00e9es, y compris en
    // revenant sur une page d\u00e9j\u00e0 visit\u00e9e.
    if (requestKey === loadedKey.current) return;
    loadedKey.current = requestKey;
    void reload(filters, page);
  }, [requestKey, filters, page, reload]);
  // La recherche interroge la base : on attend une courte pause de frappe.
  useEffect(() => {
    if (search === filters.query) return;
    const timer = setTimeout(() => {
      setFilters((current) => ({ ...current, query: search }));
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search, filters.query]);
  const setFilter = <K extends keyof TogeFilters>(key: K, value: TogeFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };
  const refresh = () => void reload(filters, page);
  const hasFilters = Boolean(search) || JSON.stringify(filters) !== JSON.stringify(emptyTogeFilters);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const remove = (row: TogeRecord) => {
    if (!window.confirm(`Supprimer la vente de ${row.customerName} ?`)) return;
    startTransition(async () => { const result = await deleteToge(row.id); if (result.success) refresh(); });
  };
  const resetFilters = () => { setSearch(""); setFilters(emptyTogeFilters); setPage(1); };
  const toggleDelivered = (row: TogeRecord, checked: boolean) => {
    setRows((current) => current.map((item) => item.id === row.id ? { ...item, isDelivered: checked } : item));
    startTransition(async () => {
      const result = await updateTogeDelivered(row.id, checked);
      if (!result.success) setRows((current) => current.map((item) => item.id === row.id ? { ...item, isDelivered: !checked } : item));
    });
  };
  return <div className="max-w-7xl">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold tracking-[0.2em] text-indigo-600 uppercase">Gestion des ventes</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Toges</h1><p className="mt-2 text-sm text-slate-500">Suivez les toges vendues séparément et les règlements.</p></div><button className="btn-primary" onClick={() => setDrawer("new")}>+ Ajouter une vente</button></div>
    <div className="mb-5 rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-56 flex-1 text-xs font-semibold text-slate-500">Rechercher
          <input type="search" className="field mt-2" placeholder="Nom, téléphone ou élément…" value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
        <label className="text-xs font-semibold text-slate-500">Vente du<input type="date" className="field mt-2" value={filters.from} max={filters.to || undefined} onChange={(event) => setFilter("from", event.target.value)} /></label>
        <label className="text-xs font-semibold text-slate-500">Au<input type="date" className="field mt-2" value={filters.to} min={filters.from || undefined} onChange={(event) => setFilter("to", event.target.value)} /></label>
        <button
          type="button"
          className={`icon-action h-11 w-11 shrink-0 border ${showFilters ? "border-indigo-300 bg-indigo-600 text-white shadow-sm" : "border-indigo-200 bg-indigo-100 text-indigo-700 hover:bg-indigo-200"}`}
          title={showFilters ? "Masquer les filtres" : "Afficher les filtres"}
          aria-label={showFilters ? "Masquer les filtres" : "Afficher les filtres"}
          aria-expanded={showFilters}
          aria-controls="toge-filters"
          onClick={() => setShowFilters((current) => !current)}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]" strokeLinecap="round">
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
        </button>
      </div>
      <div id="toge-filters" hidden={!showFilters} className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-semibold text-slate-500">Élément<select className="field mt-2" value={filters.element} onChange={(event) => setFilter("element", event.target.value)}><option value="">Tous les éléments</option>{togeOptions.elements.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="text-xs font-semibold text-slate-500">Couleur<select className="field mt-2" value={filters.color} onChange={(event) => setFilter("color", event.target.value)}><option value="">Toutes les couleurs</option>{togeOptions.colors.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="text-xs font-semibold text-slate-500">Taille<select className="field mt-2" value={filters.size} onChange={(event) => setFilter("size", event.target.value)}><option value="">Toutes les tailles</option>{togeOptions.sizes.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="text-xs font-semibold text-slate-500">Localisation<select className="field mt-2" value={filters.location} onChange={(event) => setFilter("location", event.target.value)}><option value="">Toutes les localisations</option><option value="none">Non renseignée</option>{togeOptions.locations.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="text-xs font-semibold text-slate-500">Livraison<select className="field mt-2" value={filters.delivered} onChange={(event) => setFilter("delivered", event.target.value)}><option value="">Toutes</option><option value="yes">Livrées</option><option value="no">Non livrées</option></select></label>
        <label className="text-xs font-semibold text-slate-500">Paiement<select className="field mt-2" value={filters.payment} onChange={(event) => setFilter("payment", event.target.value)}><option value="">Tous</option><option value="paid">Soldées</option><option value="due">Reste à payer</option></select></label>
      </div>
    </div>
    <div className="mb-3 flex items-center justify-between"><p role="status" className="text-sm text-slate-500">{loading ? "Chargement…" : `${total} vente(s)${hasFilters ? " correspondant aux filtres" : ""}`}</p>{hasFilters && <button type="button" className="action-button" onClick={resetFilters}>Réinitialiser les filtres</button>}</div>
    {error && <p role="alert" className="mb-3 text-sm text-red-600">{error}</p>}
    <div className={`overflow-x-auto rounded-2xl border border-indigo-100 bg-white shadow-[0_8px_30px_rgba(79,70,229,0.06)] transition-opacity ${loading ? "opacity-60" : ""}`} aria-busy={loading}><table className="w-full text-left text-sm"><thead className="border-b border-indigo-100 bg-indigo-50/80 text-xs font-bold tracking-wide text-indigo-800 uppercase"><tr><th className="px-4 py-4">Client</th><th className="px-4 py-4">Élément</th><th className="px-4 py-4">Couleur / taille</th><th className="px-4 py-4">Lieu</th><th className="px-4 py-4">Prix</th><th className="px-4 py-4">Reste</th><th className="px-4 py-4">Livré</th><th className="px-4 py-4 text-right">Actions</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-b border-slate-100 last:border-0"><td className="px-4 py-4"><p className="font-bold text-slate-900">{row.customerName}</p><p className="text-xs text-slate-500">{row.phone}</p></td><td className="px-4 py-4 font-semibold text-slate-700">{row.element}</td><td className="px-4 py-4"><span className="font-semibold">{row.color}</span><span className="ml-2 rounded-md bg-slate-100 px-2 py-1 text-xs font-bold">{row.size}</span></td><td className="px-4 py-4 text-xs font-semibold text-slate-600">{row.location}</td><td className="px-4 py-4 font-bold tabular-nums">{money(String(netPrice(row)))}{Number(row.discount || 0) > 0 && <p className="text-xs font-medium text-emerald-700">{money(row.price)} − {money(row.discount)}</p>}<p className="text-xs font-medium text-slate-500">Avance {money(row.advance)}</p></td><td className="px-4 py-4 font-bold text-amber-600 tabular-nums">{money(String(remaining(row)))}</td><td className="px-4 py-4"><label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-600"><input type="checkbox" className="h-4 w-4 accent-indigo-600" checked={row.isDelivered} onChange={(event) => toggleDelivered(row, event.target.checked)} />{row.isDelivered ? "Oui" : "Non"}</label></td><td className="px-4 py-4"><div className="flex justify-end gap-2"><button className="icon-action bg-indigo-50 text-indigo-600" title="Modifier" aria-label="Modifier" onClick={() => setDrawer(row)}>✎</button><button className="icon-action bg-red-50 text-red-600" title="Supprimer" aria-label="Supprimer" disabled={pending} onClick={() => remove(row)}>⌫</button></div></td></tr>)}{!rows.length && <tr><td colSpan={8} className="px-4 py-14 text-center text-sm text-slate-500">{loading ? "Chargement des ventes…" : "Aucune vente trouvée."}</td></tr>}</tbody></table></div>
    <Pagination page={page} pageCount={pageCount} start={start} end={start + rows.length} total={total} noun="ventes" onPage={setPage} />
    {drawer && <SettingsDrawer title={drawer === "new" ? "Ajouter une vente de toge" : "Modifier la vente"} onClose={() => setDrawer(null)}><TogeForm toge={drawer === "new" ? undefined : drawer} onDone={(row) => { setDrawer(null); if (row) refresh(); }} /></SettingsDrawer>}
  </div>;
}
