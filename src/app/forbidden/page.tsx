import { requireUser } from "@/lib/auth";
import { logout } from "../auth-actions";

export default async function ForbiddenPage() {
  const user = await requireUser();
  return <main className="grid min-h-screen place-items-center p-6"><div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-amber-50 text-2xl">🔒</div><h1 className="mt-5 text-2xl font-bold text-slate-950">No workspace access</h1><p className="mt-3 text-slate-500">Hi {user.name}, your account is active but has no access to the available CRM areas. Ask an administrator to update your permissions.</p><form action={logout}><button className="btn-secondary mt-6">Sign out</button></form></div></main>;
}
