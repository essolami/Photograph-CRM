import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MobileHeader, Sidebar } from "../sidebar";
import { CreateUserForm } from "./create-user-form";
import { updateUser } from "./actions";

const permissions = [["canViewClients", "Clients: view"], ["canManageClients", "Clients: manage"], ["canViewInvoices", "Invoices: view"], ["canManageInvoices", "Invoices: manage"], ["canManageUsers", "Users: manage"]] as const;

export default async function AdminPage() {
  const currentUser = await requirePermission("canManageUsers");
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  return <div className="flex min-h-screen"><Sidebar user={currentUser}/><div className="min-w-0 flex-1"><MobileHeader/><main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
    <p className="text-sm font-semibold tracking-wide text-indigo-600">ADMINISTRATION</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Users & permissions</h1><p className="mt-2 text-slate-500">Control who can access each part of your CRM.</p>
    <div className="mt-8"><CreateUserForm/></div>
    <section className="mt-8"><h2 className="mb-4 text-lg font-bold text-slate-950">Team members <span className="ml-1 text-sm font-normal text-slate-400">({users.length})</span></h2><div className="space-y-4">{users.map(user => <form action={updateUser} key={user.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><input type="hidden" name="id" value={user.id}/><div className="flex flex-col gap-4 xl:flex-row xl:items-center"><div className="flex min-w-56 items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{user.name.split(/\s+/).map(x=>x[0]).slice(0,2).join("")}</span><div><p className="font-semibold text-slate-900">{user.name}{user.id === currentUser.id && <span className="ml-2 text-xs text-indigo-600">You</span>}</p><p className="text-sm text-slate-500">{user.email}</p></div></div><div className="flex flex-1 flex-wrap gap-2">{permissions.map(([name,label]) => <label key={name} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600"><input type="checkbox" name={name} defaultChecked={user[name]} disabled={user.id === currentUser.id && name === "canManageUsers"} className="accent-indigo-600"/>{label}</label>)}</div><label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" name="isActive" defaultChecked={user.isActive} disabled={user.id === currentUser.id} className="accent-indigo-600"/> Active</label><button className="btn-secondary shrink-0">Save access</button></div></form>)}</div></section>
  </main></div></div>;
}
