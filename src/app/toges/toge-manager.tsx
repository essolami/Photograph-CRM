"use client";

import { useState, useTransition } from "react";
import { deleteToge, updateTogeDelivered } from "./actions";
import { SettingsDrawer } from "../(dashboard)/parametres/settings-drawer";
import { TogeForm, type TogeRecord } from "./toge-form";

const money = (value: string) => new Intl.NumberFormat("fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value)) + " DH";
const remaining = (row: TogeRecord) => Math.max(0, Number(row.price) - Number(row.advance));

export function TogeManager({ initialRows }: { initialRows: TogeRecord[] }) {
  const [rows, setRows] = useState(initialRows);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [color, setColor] = useState("");
  const [drawer, setDrawer] = useState<TogeRecord | "new" | null>(null);
  const [pending, startTransition] = useTransition();
  const filtered = rows.filter((row) => `${row.customerName} ${row.phone} ${row.element}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()) && (!location || row.location === location) && (!color || row.color === color));
  const remove = (row: TogeRecord) => {
    if (!window.confirm(`Supprimer la vente de ${row.customerName} ?`)) return;
    startTransition(async () => { const result = await deleteToge(row.id); if (result.success) setRows((current) => current.filter((item) => item.id !== row.id)); });
  };
  const resetFilters = () => { setQuery(""); setLocation(""); setColor(""); };
  const toggleDelivered = (row: TogeRecord, checked: boolean) => {
    setRows((current) => current.map((item) => item.id === row.id ? { ...item, isDelivered: checked } : item));
    startTransition(async () => {
      const result = await updateTogeDelivered(row.id, checked);
      if (!result.success) setRows((current) => current.map((item) => item.id === row.id ? { ...item, isDelivered: !checked } : item));
    });
  };
  return <div className="max-w-7xl">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold tracking-[0.2em] text-indigo-600 uppercase">Gestion des ventes</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Toges</h1><p className="mt-2 text-sm text-slate-500">Suivez les toges vendues séparément et les règlements.</p></div><button className="btn-primary" onClick={() => setDrawer("new")}>+ Ajouter une vente</button></div>
    <div className="mb-5 flex flex-wrap gap-3 rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm"><input className="field min-w-56 flex-1" placeholder="Rechercher un client…" value={query} onChange={(event) => setQuery(event.target.value)} /><select className="field w-48" value={location} onChange={(event) => setLocation(event.target.value)}><option value="">Toutes les localisations</option><option>CASABLANCA</option><option>HORS CASABLANCA</option></select><select className="field w-40" value={color} onChange={(event) => setColor(event.target.value)}><option value="">Toutes les couleurs</option>{["BORDEAUX", "NOIR", "BLEU NUIT", "VERT", "BEIGE", "BLEU ROI"].map((item) => <option key={item}>{item}</option>)}</select><button type="button" className="btn-secondary" onClick={resetFilters}>Réinitialiser</button></div>
    <p className="mb-3 text-sm font-semibold text-slate-500">{filtered.length} vente(s)</p>
    <div className="overflow-x-auto rounded-2xl border border-indigo-100 bg-white shadow-[0_8px_30px_rgba(79,70,229,0.06)]"><table className="w-full text-left text-sm"><thead className="border-b border-indigo-100 bg-indigo-50/80 text-xs font-bold tracking-wide text-indigo-800 uppercase"><tr><th className="px-4 py-4">Client</th><th className="px-4 py-4">Élément</th><th className="px-4 py-4">Couleur / taille</th><th className="px-4 py-4">Lieu</th><th className="px-4 py-4">Prix</th><th className="px-4 py-4">Reste</th><th className="px-4 py-4">Livré</th><th className="px-4 py-4 text-right">Actions</th></tr></thead><tbody>{filtered.map((row) => <tr key={row.id} className="border-b border-slate-100 last:border-0"><td className="px-4 py-4"><p className="font-bold text-slate-900">{row.customerName}</p><p className="text-xs text-slate-500">{row.phone}</p></td><td className="px-4 py-4 font-semibold text-slate-700">{row.element}</td><td className="px-4 py-4"><span className="font-semibold">{row.color}</span><span className="ml-2 rounded-md bg-slate-100 px-2 py-1 text-xs font-bold">{row.size}</span></td><td className="px-4 py-4 text-xs font-semibold text-slate-600">{row.location}</td><td className="px-4 py-4 font-bold tabular-nums">{money(row.price)}<p className="text-xs font-medium text-slate-500">Avance {money(row.advance)}</p></td><td className="px-4 py-4 font-bold text-amber-600 tabular-nums">{money(String(remaining(row)))}</td><td className="px-4 py-4"><label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-600"><input type="checkbox" className="h-4 w-4 accent-indigo-600" checked={row.isDelivered} onChange={(event) => toggleDelivered(row, event.target.checked)} />{row.isDelivered ? "Oui" : "Non"}</label></td><td className="px-4 py-4"><div className="flex justify-end gap-2"><button className="icon-action bg-indigo-50 text-indigo-600" title="Modifier" aria-label="Modifier" onClick={() => setDrawer(row)}>✎</button><button className="icon-action bg-red-50 text-red-600" title="Supprimer" aria-label="Supprimer" disabled={pending} onClick={() => remove(row)}>⌫</button></div></td></tr>)}{!filtered.length && <tr><td colSpan={8} className="px-4 py-14 text-center text-sm text-slate-500">Aucune vente trouvée.</td></tr>}</tbody></table></div>
    {drawer && <SettingsDrawer title={drawer === "new" ? "Ajouter une vente de toge" : "Modifier la vente"} onClose={() => setDrawer(null)}><TogeForm toge={drawer === "new" ? undefined : drawer} onDone={(row) => { if (row) setRows((current) => drawer === "new" ? [row, ...current] : current.map((item) => item.id === row.id ? row : item)); setDrawer(null); }} /></SettingsDrawer>}
  </div>;
}
