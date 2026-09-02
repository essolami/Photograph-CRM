"use client";

import { useActionState, useEffect, useRef } from "react";
import { createUser } from "./actions";
import { useToast } from "../toast";

const permissions = [
  ["canViewClients", "View clients"], ["canManageClients", "Create, edit & delete clients"],
  ["canViewInvoices", "View invoices"], ["canManageInvoices", "Create & edit invoices"],
  ["canManageUsers", "Manage users & permissions"],
];

export function CreateUserForm() {
  const toast = useToast();
  const [state, action, pending] = useActionState(createUser, {});
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.success) { form.current?.reset(); toast.success("User created successfully."); } if (state.error) toast.error(state.error); }, [state.success, state.error, toast]);
  return <form ref={form} action={action} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <h2 className="text-lg font-bold text-slate-950">Create user</h2><p className="mt-1 text-sm text-slate-500">Add a team member and choose their access.</p>
    <div className="mt-5 grid gap-4 sm:grid-cols-2"><label><span className="mb-2 block text-sm font-medium">Full name</span><input className="field" name="name" required /></label><label><span className="mb-2 block text-sm font-medium">Email</span><input className="field" name="email" type="email" required /></label><label className="sm:col-span-2"><span className="mb-2 block text-sm font-medium">Temporary password</span><input className="field" name="password" type="password" minLength={8} required /></label></div>
    <fieldset className="mt-5"><legend className="text-sm font-semibold text-slate-800">Permissions</legend><div className="mt-3 grid gap-3 sm:grid-cols-2">{permissions.map(([name,label]) => <label key={name} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm text-slate-700"><input type="checkbox" name={name} defaultChecked={name === "canViewClients"} className="h-4 w-4 accent-indigo-600" />{label}</label>)}</div></fieldset>
    {state.error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>}{state.success && <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">User created successfully.</p>}
    <button disabled={pending} className="btn-primary mt-5">{pending ? "Creating…" : "Create user"}</button>
  </form>;
}
