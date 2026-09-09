"use client";

import { useActionState, useEffect, useState } from "react";
import { createUser } from "./actions";
import { useToast } from "../../toast";

const roles = [
  ["ADMIN", "Administrateur", "Accès complet et gestion des comptes"],
  ["MANAGER", "Manager", "Accès complet aux clients et paramètres"],
  ["MONTAGE", "Montage", "Consultation et modification du lien Drive"],
  ["USER", "Utilisateur normal", "Consultation limitée sans téléphone ni montants"],
] as const;

export function CreateUserForm({ editors = [] }: { editors?: { id: number; name: string }[] }) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("USER");
  const [editorId, setEditorId] = useState("");
  const [state, action, pending] = useActionState(
    async (previous: { error?: string; success?: boolean }, data: FormData) => {
      const result = await createUser(previous, data);
      if (result.success) {
        setName("");
        setEmail("");
        setPassword("");
        setRole("USER");
        setEditorId("");
      }
      return result;
    },
    {},
  );
  useEffect(() => {
    if (state.success) {
      toast.success("Compte créé avec succès.");
    }
    if (state.error) toast.error(state.error);
  }, [state.success, state.error, toast]);
  return (
    <form
      action={action}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-bold text-slate-950">Create user</h2>
      <p className="mt-1 text-sm text-slate-500">
        Ajoutez un membre et choisissez son rôle.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label>
          <span className="mb-2 block text-sm font-medium">Full name</span>
          <input className="field" name="name" value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label>
          <span className="mb-2 block text-sm font-medium">Email</span>
          <input className="field" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label className="sm:col-span-2">
          <span className="mb-2 block text-sm font-medium">
            Temporary password
          </span>
          <input
            className="field"
            name="password"
            type="password"
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
      </div>
      <fieldset className="mt-5">
        <legend className="text-sm font-semibold text-slate-800">Rôle</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {roles.map(([value, label, description]) => (
            <label key={value} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm text-slate-700 has-[:checked]:border-indigo-300 has-[:checked]:bg-indigo-50">
              <input type="radio" name="role" value={value} checked={role === value} onChange={() => setRole(value)} className="mt-1 h-4 w-4 accent-indigo-600" />
              <span><span className="block font-semibold">{label}</span><span className="text-xs text-slate-500">{description}</span></span>
            </label>
          ))}
        </div>
      </fieldset>
      {role === "MONTAGE" && <label className="mt-4 block"><span className="mb-2 block text-sm font-medium">Monteur associé</span><select className="field" name="editorId" value={editorId} onChange={event => setEditorId(event.target.value)} required><option value="">Sélectionner le monteur</option>{editors.map(editor => <option key={editor.id} value={editor.id}>{editor.name}</option>)}</select><span className="mt-1 block text-xs text-slate-500">Ses tâches seront liées à ce profil.</span></label>}
      {state.error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          User created successfully.
        </p>
      )}
      <button disabled={pending} className="btn-primary mt-5">
        {pending ? "Creating…" : "Create user"}
      </button>
    </form>
  );
}
