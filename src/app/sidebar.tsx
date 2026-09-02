import { logout } from "./auth-actions";

type SidebarUser = { name: string; email: string; canViewClients: boolean; canViewInvoices: boolean; canManageUsers: boolean };

const navItems = [
  { label: "Dashboard", icon: "dashboard" },
  { label: "Clients", icon: "clients", active: true },
  { label: "Bookings", icon: "calendar" },
  { label: "Projects", icon: "camera" },
  { label: "Invoices", icon: "invoice" },
];

function Icon({ name }: { name: string }) {
  const common = "h-5 w-5 fill-none stroke-current stroke-[1.8]";
  if (name === "dashboard") return <svg viewBox="0 0 24 24" className={common}><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>;
  if (name === "clients") return <svg viewBox="0 0 24 24" className={common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
  if (name === "calendar") return <svg viewBox="0 0 24 24" className={common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></svg>;
  if (name === "camera") return <svg viewBox="0 0 24 24" className={common}><path d="M14.5 4 16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3h5Z"/><circle cx="12" cy="13" r="4"/></svg>;
  return <svg viewBox="0 0 24 24" className={common}><path d="M6 2h9l4 4v16H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"/><path d="M14 2v5h5M8 13h8M8 17h6"/></svg>;
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-indigo-600 shadow-lg shadow-indigo-950/20">
        <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden="true"><circle cx="20" cy="20" r="8" fill="none" stroke="white" strokeWidth="3"/><circle cx="20" cy="20" r="3" fill="#a5b4fc"/><path d="M6 15h7l3-4h8l3 4h7v17H6Z" fill="none" stroke="white" strokeWidth="2.5" strokeLinejoin="round"/></svg>
      </span>
      {!compact && <span><span className="block text-lg font-bold tracking-tight text-white">Luma<span className="text-indigo-400">CRM</span></span><span className="block text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">Photography studio</span></span>}
    </div>
  );
}

export function Sidebar({ user }: { user: SidebarUser }) {
  const visibleItems = navItems.filter(item => item.label !== "Clients" || user.canViewClients).filter(item => item.label !== "Invoices" || user.canViewInvoices);
  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col bg-slate-950 px-4 py-6 lg:sticky lg:top-0 lg:flex">
      <div className="px-2"><Brand /></div>
      <nav className="mt-10 flex-1" aria-label="Main navigation">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">Workspace</p>
        <div className="space-y-1">
          {visibleItems.map((item) => (
            <a key={item.label} href={item.active ? "/" : "#"} aria-current={item.active ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${item.active ? "bg-indigo-600 text-white shadow-lg shadow-indigo-950/30" : "text-slate-400 hover:bg-slate-900 hover:text-white"}`}>
              <Icon name={item.icon} />{item.label}
            </a>
          ))}
        </div>
        <p className="mb-3 mt-8 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">Manage</p>
        {user.canManageUsers && <a href="/admin" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-slate-900 hover:text-white"><Icon name="clients"/> Users & permissions</a>}
      </nav>
      <div className="border-t border-slate-800 pt-5">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 text-xs font-bold text-white">AP</span>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-white">{user.name}</p><p className="truncate text-xs text-slate-500">{user.email}</p></div>
          <form action={logout}><button title="Sign out" aria-label="Sign out" className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-900 hover:text-white">↪</button></form>
        </div>
      </div>
    </aside>
  );
}

export function MobileHeader() {
  return <header className="flex items-center justify-between bg-slate-950 px-4 py-3 lg:hidden"><Brand/><button aria-label="Open menu" className="grid h-10 w-10 place-items-center rounded-xl border border-slate-800 text-xl text-white">☰</button></header>;
}
