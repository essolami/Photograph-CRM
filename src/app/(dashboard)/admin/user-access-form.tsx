"use client";

import { useActionState, useEffect, useState } from "react";
import { ActionIcon } from "../../action-icon";
import { updateUser } from "./actions";
import { useToast } from "../../toast";

type ManagedUser = {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  role: string;
  editorId: number | null;
};
const roles = [["ADMIN", "Administrateur"], ["MANAGER", "Manager"], ["MONTAGE", "Montage"], ["USER", "Utilisateur normal"]] as const;

export function UserAccessForm({
  user,
  editors,
  isSelf,
}: {
  user: ManagedUser;
  editors: { id: number; name: string }[];
  isSelf: boolean;
}) {
  const [state, action, pending] = useActionState(updateUser, {});
  const [role, setRole] = useState(user.role || "USER");
  const toast = useToast();
  useEffect(() => {
    if (state.success) toast.success(`Access saved for ${user.name}.`);
    if (state.error) toast.error(state.error);
  }, [state, toast, user.name]);
  return (
    <form
      action={action}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <input type="hidden" name="id" value={user.id} />
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
        <div className="flex min-w-56 items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
            {user.name
              .split(/\s+/)
              .map((x) => x[0])
              .slice(0, 2)
              .join("")}
          </span>
          <div>
            <p className="font-semibold text-slate-900">
              {user.name}
              {isSelf && (
                <span className="ml-2 text-xs text-indigo-600">You</span>
              )}
            </p>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
        </div>
        <label className="flex flex-1 items-center gap-2 text-sm font-semibold text-slate-600">
          Rôle
          <select name="role" value={role} onChange={event => setRole(event.target.value)} disabled={isSelf} className="field max-w-52 py-2 text-xs">
            {roles.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        {role === "MONTAGE" && <label className="flex flex-1 items-center gap-2 text-sm font-semibold text-slate-600">Monteur<select name="editorId" defaultValue={user.editorId ?? ""} className="field max-w-52 py-2 text-xs" required><option value="">Sélectionner</option>{editors.map(editor => <option key={editor.id} value={editor.id}>{editor.name}</option>)}</select></label>}
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={user.isActive}
            disabled={isSelf}
            className="accent-indigo-600"
          />{" "}
          Active
        </label>
        <button
          disabled={pending}
          className="icon-action shrink-0"
          title="Enregistrer les accès"
          aria-label="Enregistrer les accès"
        >
          <ActionIcon name={pending ? "loading" : "save"} />
        </button>
      </div>
    </form>
  );
}
