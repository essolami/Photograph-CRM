"use client";

import { useActionState, useState } from "react";
import { saveToge, type TogeState } from "./actions";
import { elementPrices, togeOptions } from "./options";

export type TogeRecord = {
  id: number;
  customerName: string;
  phone: string;
  element: string;
  color: string;
  size: string;
  location: string;
  price: string;
  discount: string;
  advance: string;
  isDelivered: boolean;
  createdAt: string;
};

const money = (value: number) => new Intl.NumberFormat("fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value) + " DH";

export function TogeForm({ toge, onDone }: { toge?: TogeRecord; onDone: (row?: TogeRecord) => void }) {
  const [element, setElement] = useState(toge?.element ?? "");
  const [discount, setDiscount] = useState(toge?.discount ?? "0");
  const [advance, setAdvance] = useState(toge?.advance ?? "0");
  const [state, action, pending] = useActionState(
    async (previous: TogeState, data: FormData) => {
      const result = await saveToge(previous, data);
      if (result.success) onDone(result.row);
      return result;
    },
    {},
  );
  const price = elementPrices[element as keyof typeof elementPrices] ?? 0;
  const discountValue = Math.min(Math.max(Number(discount) || 0, 0), price);
  const netPrice = Math.max(0, price - discountValue);
  const advanceValue = Math.max(Number(advance) || 0, 0);
  const field = (name: string, label: string, value = "", type = "text") => (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <input className="field mt-2" name={name} defaultValue={value} type={type} required />
    </label>
  );
  const select = (name: string, label: string, options: readonly string[], value: string) => (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <select className="field mt-2" name={name} defaultValue={name === "element" ? undefined : value} value={name === "element" ? element : undefined} onChange={name === "element" ? (event) => setElement(event.target.value) : undefined} required={name !== "location"}>
        <option value="">{name === "location" ? "Non renseignée" : "Sélectionner"}</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
  return (
    <form action={action} className="space-y-5">
      {toge && <input type="hidden" name="id" value={toge.id} />}
      {state.error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{state.error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {field("customerName", "Nom du client", toge?.customerName)}
        {field("phone", "Téléphone", toge?.phone, "tel")}
        {select("element", "Élément", togeOptions.elements, toge?.element ?? "")}
        {select("color", "Couleur", togeOptions.colors, toge?.color ?? "")}
        {select("size", "Taille", togeOptions.sizes, toge?.size ?? "")}
        {select("location", "Localisation", togeOptions.locations, toge?.location ?? "")}
        <label className="block text-sm font-semibold text-slate-700">Prix (DH)<input className="field mt-2" value={price ? price.toFixed(2) : ""} placeholder="Calculé automatiquement" readOnly /><input type="hidden" name="price" value={price || ""} /></label>
        <label className="block text-sm font-semibold text-slate-700">
          Réduction (DH)
          <input className="field mt-2" name="discount" type="number" min="0" max={price || undefined} step="0.01" value={discount} onChange={(event) => setDiscount(event.target.value)} />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Avance (DH)
          <input className="field mt-2" name="advance" type="number" min="0" max={netPrice || undefined} step="0.01" value={advance} onChange={(event) => setAdvance(event.target.value)} required />
        </label>
      </div>
      <label className="flex items-center gap-3 text-sm font-semibold text-slate-700"><input className="h-4 w-4 accent-indigo-600" type="checkbox" name="isDelivered" defaultChecked={toge?.isDelivered ?? false} /> Livré</label>
      <dl className="space-y-2 rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 text-sm">
        <div className="flex justify-between gap-4"><dt className="text-slate-600">Prix catalogue</dt><dd className="font-semibold tabular-nums">{price ? money(price) : "—"}</dd></div>
        <div className="flex justify-between gap-4 text-emerald-700"><dt>Réduction</dt><dd className="font-semibold tabular-nums">− {money(discountValue)}</dd></div>
        <div className="flex justify-between gap-4 border-t border-indigo-100 pt-2"><dt className="font-bold text-slate-800">Prix à payer</dt><dd className="font-bold tabular-nums">{price ? money(netPrice) : "—"}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-slate-600">Avance</dt><dd className="font-semibold tabular-nums">{money(advanceValue)}</dd></div>
        <div className="flex justify-between gap-4"><dt className="font-bold text-slate-800">Reste à payer</dt><dd className="font-extrabold tabular-nums text-amber-700">{price ? money(Math.max(0, netPrice - advanceValue)) : "—"}</dd></div>
      </dl>
      <div className="flex items-center justify-between border-t border-slate-100 pt-5">
        <p className="text-xs text-slate-500">La réduction est un montant en dirhams, retiré du prix.</p>
        <button className="btn-primary" disabled={pending}>{pending ? "Enregistrement…" : toge ? "Enregistrer" : "Ajouter"}</button>
      </div>
    </form>
  );
}
