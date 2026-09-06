"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { SettingsNav } from "./(dashboard)/parametres/settings-nav";
import { logout } from "./auth-actions";

type SidebarUser = {
  name: string;
  email: string;
  canViewClients: boolean;
  canViewInvoices: boolean;
  canManageUsers: boolean;
};

const navItems = [
  { label: "Tableau de bord", icon: "dashboard" },
  { label: "Clients", icon: "clients", active: true },
];

function Icon({ name }: { name: string }) {
  const common = "h-5 w-5 fill-none stroke-current stroke-[1.8]";
  if (name === "dashboard")
    return (
      <svg viewBox="0 0 24 24" className={common}>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </svg>
    );
  if (name === "clients")
    return (
      <svg viewBox="0 0 24 24" className={common}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  if (name === "calendar")
    return (
      <svg viewBox="0 0 24 24" className={common}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 11h18" />
      </svg>
    );
  if (name === "camera")
    return (
      <svg viewBox="0 0 24 24" className={common}>
        <path d="M14.5 4 16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3h5Z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" className={common}>
      <path d="M6 2h9l4 4v16H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
      <path d="M14 2v5h5M8 13h8M8 17h6" />
    </svg>
  );
}

export function Brand({
  compact = false,
  dark = false,
}: {
  compact?: boolean;
  dark?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-black shadow-lg shadow-indigo-950/20">
        <Image
          src="/Graduation-logo.jpg"
          alt="Graduation.ma"
          fill
          sizes="44px"
          className="object-cover"
        />
      </span>
      {!compact && (
        <span>
          <span
            className={`block text-lg font-extrabold tracking-tight ${dark ? "text-white" : "text-slate-950"}`}
          >
            Graduation
          </span>
          <span
            className={`block text-[10px] font-semibold tracking-[0.2em] uppercase ${dark ? "text-indigo-200/70" : "text-slate-500"}`}
          >
            Studio photographique
          </span>
        </span>
      )}
    </div>
  );
}

export function Sidebar({
  user,
  activePage = "clients",
}: {
  user: SidebarUser;
  activePage?: "clients" | "settings" | "admin";
}) {
  const pathname = usePathname();
  const currentPage = pathname.startsWith("/admin")
    ? "admin"
    : pathname.startsWith("/parametres")
      ? "settings"
      : activePage;
  const visibleItems = navItems
    .filter((item) => item.label !== "Clients" || user.canViewClients)
    .filter((item) => item.label !== "Factures" || user.canViewInvoices);
  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-indigo-950 bg-gradient-to-b from-[#242450] via-[#1b2140] to-[#11182c] px-4 py-7 lg:sticky lg:top-0 lg:flex">
      <div className="px-2">
        <Brand dark />
      </div>
      <nav className="mt-10 flex-1" aria-label="Navigation principale">
        <p className="mb-3 px-3 text-[10px] font-semibold tracking-[0.2em] text-indigo-200/60 uppercase">
          Espace de travail
        </p>
        <div className="space-y-1">
          {visibleItems.map((item) => (
            <Link
              key={item.label}
              href={item.active ? "/" : "#"}
              prefetch={false}
              aria-current={
                item.active && currentPage === "clients" ? "page" : undefined
              }
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${item.active && currentPage === "clients" ? "bg-indigo-500 text-white shadow-lg shadow-indigo-950/30" : "text-indigo-100/80 hover:bg-white/10 hover:text-white"}`}
            >
              <Icon name={item.icon} />
              {item.label}
            </Link>
          ))}
        </div>
        {user.canManageUsers && (
          <>
            <p className="mt-8 mb-3 px-3 text-[10px] font-semibold tracking-[0.2em] text-indigo-200/60">
              PARAMÈTRES
            </p>
            <SettingsNav />
          </>
        )}
        {user.canManageUsers && (
          <Link
            href="/admin"
            prefetch={false}
            aria-current={currentPage === "admin" ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${currentPage === "admin" ? "bg-indigo-500 text-white shadow-lg shadow-indigo-950/30" : "text-indigo-100/80 hover:bg-white/10 hover:text-white"}`}
          >
            <Icon name="clients" /> Utilisateurs et accès
          </Link>
        )}
      </nav>
      <div className="mt-8 border-t border-white/10 pt-5">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-indigo-400/20 text-xs font-bold text-indigo-200">
            {user.name
              .split(" ")
              .map((part) => part[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">{user.name}</p>
            <p className="truncate text-xs text-indigo-200/70">{user.email}</p>
          </div>
          <form action={logout}>
            <button
              title="Se déconnecter"
              aria-label="Se déconnecter"
              className="rounded-lg px-2 py-1 text-indigo-200/70 hover:bg-white/10 hover:text-white"
            >
              ↪
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}

export function MobileHeader() {
  return (
    <header className="flex items-center justify-between border-b border-white/10 bg-[#242450] px-4 py-3 lg:hidden">
      <Brand dark />
      <Link
        href="/parametres"
        aria-label="Paramètres"
        className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 text-xl text-indigo-100"
      >
        ⚙
      </Link>
    </header>
  );
}
