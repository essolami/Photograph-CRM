import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { Sidebar, MobileHeader } from "../sidebar";
import { SettingsNav } from "./settings-nav";
export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  if (!user.canManageUsers) redirect("/forbidden");
  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} activePage="settings" />
      <div className="min-w-0 flex-1">
        <MobileHeader />
        <header className="hidden h-20 items-center justify-between border-b border-slate-200/70 bg-white/80 px-10 lg:flex">
          <p className="flex items-center gap-3 text-sm">
            <span className="text-slate-400">Espace de travail</span>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-slate-700">Paramètres</span>
          </p>
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Administration
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:px-10 lg:py-10">
          <SettingsNav mobile />
          <div>{children}</div>
        </main>
      </div>
    </div>
  );
}
