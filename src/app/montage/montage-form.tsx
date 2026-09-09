"use client";
import { useActionState } from "react";
import { saveMontageTask, type TaskState } from "./actions";
import { taskStatuses } from "./options";
import type { MontageTask } from "./types";
export function MontageForm({ editors, clients, record, onSaved }: { editors: { id:number; name:string; phone:string|null }[]; clients:{id:number;name:string}[]; record?: MontageTask; onSaved: (row: MontageTask) => void }) {
  const [state, action, pending] = useActionState(async (previous: TaskState, data: FormData) => { const result = await saveMontageTask(previous, data); if (result.row) onSaved(result.row); return result; }, {});
  return <form action={action} className="space-y-4">
    <input type="hidden" name="id" value={record?.id ?? ""} />
    <label className="block text-sm font-semibold text-slate-700">Tâche<input className="field mt-1" name="title" required maxLength={160} defaultValue={record?.title} placeholder="Ex. Monter la vidéo de soutenance" /></label>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block text-sm font-semibold text-slate-700">Monteur<select className="field mt-1" name="editorId" required defaultValue={record?.editorId ?? ""}><option value="">Sélectionner</option>{editors.map(e=><option key={e.id} value={e.id}>{e.name}{e.phone ? ` · ${e.phone}` : ""}</option>)}</select></label>
      <label className="block text-sm font-semibold text-slate-700">Client (facultatif)<select className="field mt-1" name="clientId" defaultValue={record?.clientId ?? ""}><option value="">Aucun client</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
    </div>
    <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold text-slate-700">Échéance<input className="field mt-1" type="date" name="dueDate" defaultValue={record?.dueDate ?? ""} /></label><label className="block text-sm font-semibold text-slate-700">Statut<select className="field mt-1" name="status" defaultValue={record?.status ?? taskStatuses[0]}>{taskStatuses.map(s=><option key={s}>{s}</option>)}</select></label></div>
    <label className="block text-sm font-semibold text-slate-700">Notes<textarea className="field mt-1 min-h-28 resize-y" name="description" maxLength={5000} defaultValue={record?.description ?? ""} placeholder="Brief, livrables ou remarques…" /></label>
    {state.error && <p role="alert" className="text-sm font-medium text-red-600">{state.error}</p>}
    <button className="btn-primary w-full" disabled={pending}>{pending ? "Enregistrement…" : record ? "Enregistrer la tâche" : "Créer la tâche"}</button>
  </form>;
}
