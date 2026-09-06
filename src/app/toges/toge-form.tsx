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
  advance: string;
  isDelivered: boolean;
};

export function TogeForm({ toge, onDone }: { toge?: TogeRecord; onDone: (row?: TogeRecord) => void }) {
  const [element, setElement] = useState(toge?.element ?? "");
  const [state, action, pending] = useActionState(
    async (previous: TogeState, data: FormData) => {
      const result = await saveToge(previous, data);
      if (result.success) onDone(result.row);
      return result;
    },
    {},
  );
  const field = (name: string, label: string, value = "", type = "text") => (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <input className="field mt-2" name={name} defaultValue={value} type={type} required />
    </label>
  );
  const select = (name: string, label: string, options: readonly string[], value: string) => (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <select className="field mt-2" name={name} defaultValue={name === "element" ? undefined : value} value={name === "element" ? element : undefined} onChange={name === "element" ? (event) => setElement(event.target.value) : undefined} required>
        <option value="">Sélectionner</option>
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
        <label className="block text-sm font-semibold text-slate-700">Prix (DH)<input className="field mt-2" value={element && elementPrices[element as keyof typeof elementPrices] ? elementPrices[element as keyof typeof elementPrices].toFixed(2) : ""} placeholder="Calculé automatiquement" readOnly /><input type="hidden" name="price" value={elementPrices[element as keyof typeof elementPrices] ?? ""} /></label>
        {field("advance", "Avance (DH)", toge?.advance ?? "0", "number")}
      </div>
      <label className="flex items-center gap-3 text-sm font-semibold text-slate-700"><input className="h-4 w-4 accent-indigo-600" type="checkbox" name="isDelivered" defaultChecked={toge?.isDelivered ?? false} /> Livré</label>
      <div className="flex items-center justify-between border-t border-slate-100 pt-5">
        <p className="text-xs text-slate-500">Le reste à payer sera calculé automatiquement.</p>
        <button className="btn-primary" disabled={pending}>{pending ? "Enregistrement…" : toge ? "Enregistrer" : "Ajouter"}</button>
      </div>
    </form>
  );
}
