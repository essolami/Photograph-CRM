"use client";

import { useRef, useState, useTransition } from "react";
import * as XLSX from "xlsx";
import { importClients } from "./actions";
import { SettingsDrawer } from "./(dashboard)/parametres/settings-drawer";

export function ClientImport({ onDone, packs }: { onDone: () => void; packs: { id: number; name: string }[] }) {
  const input = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [defaultPackId, setDefaultPackId] = useState("");
  const readFile = async (file: File) => {
    setError(""); setResult(""); setFileName(file.name);
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const matrix = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, { header: 1, defval: "", raw: false });
      if (!matrix.length) throw new Error("La feuille est vide.");
      const firstRow = matrix[0].map((value) => String(value).toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, ""));
      const hasHeaders = firstRow.some((value) => ["nom", "nomprenom", "date", "pack", "fac", "faculte", "telephone"].includes(value));
      const parsed = hasHeaders
        ? XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "", raw: false })
        : matrix.map((line) => ({ date: line[0] ?? "", name: line[1] ?? "", phone: line[2] ?? "", faculty: line[3] ?? "", pack: line[4] ?? "", supplement: line[5] ?? "", advance: line[6] ?? "", photographer: line[7] ?? "" }));
      const nonEmpty = parsed.filter((row) => Object.values(row).some((value) => String(value ?? "").trim() !== ""));
      if (!nonEmpty.length) throw new Error("La feuille est vide.");
      setRows(nonEmpty);
    } catch (cause) {
      setRows([]); setError(cause instanceof Error ? cause.message : "Impossible de lire ce fichier.");
    }
  };
  const submit = () => startTransition(async () => {
    const serializableRows = rows.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [
          key,
          value instanceof Date
            ? value.toISOString()
            : value !== null && typeof value === "object"
              ? String(value)
              : value,
        ]),
      ),
    );
    const response = await importClients(serializableRows, defaultPackId ? Number(defaultPackId) : undefined);
    if (!response.success) { setError(response.error ?? "Import impossible."); return; }
    const details = response.rows?.length ? ` ${response.rows.slice(0, 3).join(" ")}` : "";
    setResult(`${response.imported ?? 0} client(s) importé(s).${details}`);
    if (!response.rows?.length) { onDone(); setOpen(false); }
  });
  return <>
    <button type="button" className="icon-action" onClick={() => setOpen(true)} title="Importer un fichier Excel" aria-label="Importer un fichier Excel">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 16V3m0 0L7 8m5-5 5 5M4 14v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" />
      </svg>
    </button>
    {open && <SettingsDrawer compact wide title="Importer des clients" onClose={() => setOpen(false)}>
      <div className="space-y-5">
        <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 p-5"><p className="font-semibold text-slate-900">Fichier Excel ou CSV</p><p className="mt-1 text-xs text-slate-500">Colonnes reconnues : nom, date, pack, supplément, faculté, avance, téléphone, photographe.</p><input ref={input} className="sr-only" type="file" accept=".xlsx,.xls,.csv" onChange={(event) => event.target.files?.[0] && readFile(event.target.files[0])} /><button type="button" className="btn-secondary mt-4" onClick={() => input.current?.click()}>Choisir un fichier</button>{fileName && <span className="ml-3 text-sm font-medium text-slate-600">{fileName}</span>}</div>
        {rows.length > 0 && <><label className="block text-sm font-semibold text-slate-700">Pack par défaut <select className="field mt-2" value={defaultPackId} onChange={(event) => setDefaultPackId(event.target.value)}><option value="">Aucun (le fichier doit contenir une colonne pack)</option>{packs.map((pack) => <option key={pack.id} value={pack.id}>{pack.name}</option>)}</select><span className="mt-1 block text-xs font-normal text-slate-500">Utilisé uniquement lorsque la colonne pack est absente ou vide.</span></label><p className="text-sm font-semibold text-slate-700">Aperçu : {rows.length} ligne(s), les 5 premières sont affichées.</p><div className="max-h-64 overflow-auto rounded-xl border border-slate-200"><table className="w-full text-left text-xs"><tbody>{rows.slice(0, 5).map((row, index) => <tr key={index} className="border-b border-slate-100 last:border-0"><td className="px-3 py-2 font-bold">{String(Object.values(row)[0] ?? "")}</td><td className="px-3 py-2">{String(Object.values(row)[1] ?? "")}</td><td className="px-3 py-2">{String(Object.values(row)[2] ?? "")}</td><td className="px-3 py-2">{String(Object.values(row)[3] ?? "")}</td></tr>)}</tbody></table></div></>}
        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {result && <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{result}</p>}
        <div className="flex justify-end gap-3"><button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Annuler</button><button type="button" className="btn-primary" disabled={!rows.length || pending} onClick={submit}>{pending ? "Import en cours…" : "Importer les clients"}</button></div>
      </div>
    </SettingsDrawer>}
  </>;
}
