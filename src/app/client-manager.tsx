"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { createClient, deleteClient, updateClient, type ClientActionState } from "./actions";
import { useToast } from "./toast";

type Client = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  createdAt: Date;
};

const initialState: ClientActionState = {};

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

function ClientForm({ client, onDone, onCancel }: { client?: Client; onDone: () => void; onCancel: () => void }) {
  const toast = useToast();
  const action = client ? updateClient : createClient;
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success) { toast.success(client ? "Client updated successfully." : "Client created successfully."); onDone(); }
    if (state.error) toast.error(state.error);
  }, [state.success, state.error, onDone, client, toast]);

  return (
    <form action={formAction} className="mt-6 space-y-5">
      {client && <input type="hidden" name="id" value={client.id} />}
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Full name</span>
        <input name="name" defaultValue={client?.name} required autoFocus placeholder="e.g. Sofia Bennett" className="field" />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Email address</span>
        <input name="email" type="email" defaultValue={client?.email} required placeholder="sofia@example.com" className="field" />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Phone <span className="font-normal text-slate-400">(optional)</span></span>
        <input name="phone" type="tel" defaultValue={client?.phone ?? ""} placeholder="+212 600 000 000" className="field" />
      </label>
      {state.error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>}
      <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button disabled={pending} className="btn-primary disabled:cursor-wait disabled:opacity-60">
          {pending ? "Saving…" : client ? "Save changes" : "Add client"}
        </button>
      </div>
    </form>
  );
}

export function ClientManager({ clients, canManage }: { clients: Client[]; canManage: boolean }) {
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Client | null | "new">(null);
  const filtered = useMemo(() => {
    const value = query.toLowerCase().trim();
    return clients.filter((client) => !value || `${client.name} ${client.email} ${client.phone ?? ""}`.toLowerCase().includes(value));
  }, [clients, query]);

  const close = () => setEditing(null);

  return (
    <>
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-semibold tracking-wide text-indigo-600">CLIENT DIRECTORY</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Clients</h1>
          <p className="mt-2 text-slate-500">Keep your contacts organized and close at hand.</p>
        </div>
        {canManage && <button onClick={() => setEditing("new")} className="btn-primary shrink-0">
          <span className="text-lg leading-none">＋</span> Add client
        </button>}
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 fill-none stroke-slate-400 stroke-2"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search clients…" className="field pl-11" />
          </div>
          <p className="text-sm text-slate-500"><span className="font-semibold text-slate-800">{clients.length}</span> {clients.length === 1 ? "client" : "clients"}</p>
        </div>

        {filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr><th className="px-6 py-4">Client</th><th className="px-6 py-4">Phone</th><th className="px-6 py-4">Added</th><th className="px-6 py-4 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((client) => (
                  <tr key={client.id} className="transition hover:bg-slate-50/70">
                    <td className="px-6 py-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{initials(client.name)}</span><div><p className="font-semibold text-slate-900">{client.name}</p><a href={`mailto:${client.email}`} className="text-slate-500 hover:text-indigo-600">{client.email}</a></div></div></td>
                    <td className="px-6 py-4 text-slate-600">{client.phone ? <a href={`tel:${client.phone}`} className="hover:text-indigo-600">{client.phone}</a> : <span className="text-slate-400">Not provided</span>}</td>
                    <td className="px-6 py-4 text-slate-500">{new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(client.createdAt))}</td>
                    <td className="px-6 py-4"><div className="flex justify-end gap-2">{canManage ? <><button onClick={() => setEditing(client)} className="action-button">Edit</button><form action={async (data) => { try { await deleteClient(data); toast.success("Client deleted successfully."); } catch { toast.error("Could not delete the client."); } }} onSubmit={(event) => { if (!window.confirm(`Delete ${client.name}? This cannot be undone.`)) event.preventDefault(); }}><input type="hidden" name="id" value={client.id}/><button className="action-button text-red-600 hover:border-red-200 hover:bg-red-50">Delete</button></form></> : <span className="text-xs text-slate-400">View only</span>}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-16 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-xl">{clients.length ? "⌕" : "👤"}</div><h2 className="mt-4 font-semibold text-slate-900">{clients.length ? "No matching clients" : "No clients yet"}</h2><p className="mt-1 text-sm text-slate-500">{clients.length ? "Try a different search term." : "Add your first client to get started."}</p>{!clients.length && canManage && <button onClick={() => setEditing("new")} className="btn-primary mt-5">Add client</button>}</div>
        )}
      </section>

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="client-dialog-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between"><div><h2 id="client-dialog-title" className="text-xl font-bold text-slate-950">{editing === "new" ? "Add a new client" : "Edit client"}</h2><p className="mt-1 text-sm text-slate-500">{editing === "new" ? "Enter their contact information below." : "Update their contact information."}</p></div><button onClick={close} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700">×</button></div>
            <ClientForm key={editing === "new" ? "new" : editing.id} client={editing === "new" ? undefined : editing} onDone={close} onCancel={close} />
          </div>
        </div>
      )}
    </>
  );
}
