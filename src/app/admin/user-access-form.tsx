"use client";

import { useActionState, useEffect } from "react";
import { ActionIcon } from "../action-icon";
import { updateUser } from "./actions";
import { useToast } from "../toast";

type ManagedUser = {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  canViewClients: boolean;
  canManageClients: boolean;
  canViewInvoices: boolean;
  canManageInvoices: boolean;
  canManageUsers: boolean;
};
const permissions = [
  ["canViewClients", "Clients: view"],
  ["canManageClients", "Clients: manage"],
  ["canViewInvoices", "Invoices: view"],
  ["canManageInvoices", "Invoices: manage"],
  ["canManageUsers", "Users: manage"],
] as const;

export function UserAccessForm({
  user,
  isSelf,
}: {
  user: ManagedUser;
  isSelf: boolean;
}) {
  const [state, action, pending] = useActionState(updateUser, {});
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
        <div className="flex flex-1 flex-wrap gap-2">
          {permissions.map(([name, label]) => (
            <label
              key={name}
              className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600"
            >
              <input
                type="checkbox"
                name={name}
                defaultChecked={user[name]}
                disabled={isSelf && name === "canManageUsers"}
                className="accent-indigo-600"
              />
              {label}
            </label>
          ))}
        </div>
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
