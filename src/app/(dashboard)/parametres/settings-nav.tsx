"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { sections } from "./config";
export function SettingsNav({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Paramètres"
      className={mobile ? "my-6 flex flex-wrap gap-2 lg:hidden" : "space-y-1"}
    >
      {Object.entries(sections).map(([key, value]) => {
        const href = `/parametres/${key}`;
        const active = pathname === href;
        return (
          <Link
            key={key}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition ${active ? "bg-indigo-500 text-white shadow-sm" : mobile ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100" : "text-indigo-100/80 hover:bg-white/10 hover:text-white"}`}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-[18px] w-[18px] shrink-0 fill-none stroke-current stroke-[1.6]"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {key === "packs" ? (
                <>
                  <path d="m12 3 9 5v9l-9 5-9-5V8l9-5Z" />
                  <path d="m3 8 9 5 9-5M12 13v9M7.5 5.5l9 5" />
                </>
              ) : key === "supplements" ? (
                <>
                  <rect x="4" y="4" width="16" height="16" rx="5" />
                  <path d="M12 8v8M8 12h8" />
                </>
              ) : key === "photographes" ? (
                <>
                  <path d="M4 7h4l2-3h4l2 3h4v13H4Z" />
                  <circle cx="12" cy="13" r="3" />
                </>
              ) : (
                <>
                  <rect x="3" y="4" width="18" height="16" rx="3" />
                  <path d="m10 9 5 3-5 3V9ZM7 4v16M17 4v16" />
                </>
              )}
            </svg>
            {value.title}
            {active && (
              <span
                aria-hidden="true"
                className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-200"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
