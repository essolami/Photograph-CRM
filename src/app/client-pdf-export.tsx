"use client";

import { useRef, useState } from "react";

const today = () => new Date().toISOString().slice(0, 10);

export function ClientPdfExport() {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState("");
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const href = `/api/clients/today-pdf?from=${encodeURIComponent(from)}${to ? `&to=${encodeURIComponent(to)}` : ""}`;

  return (
    <details
      ref={detailsRef}
      className="relative"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary
        className={`icon-action list-none cursor-pointer border ${open ? "border-indigo-300 bg-indigo-600 text-white" : "border-indigo-100 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"}`}
        title="Télécharger les soutenances en PDF"
        aria-label="Choisir les dates du PDF"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" />
          <path d="M12 12v6M9 15l3 3 3-3" />
        </svg>
      </summary>
      <div className="absolute right-0 z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-indigo-100 bg-white p-4 shadow-xl shadow-slate-900/10">
        <div className="mb-4">
          <p className="text-sm font-extrabold text-slate-900">Exporter les soutenances</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Choisissez une date, ou ajoutez une date de fin pour une période.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-600">
            Date de début
            <input className="field mt-2" type="date" value={from} max={to || undefined} onChange={(event) => setFrom(event.target.value)} required />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Date de fin (facultatif)
            <input className="field mt-2" type="date" value={to} min={from || undefined} onChange={(event) => setTo(event.target.value)} />
          </label>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <button type="button" className="text-xs font-semibold text-slate-500 hover:text-slate-800" onClick={() => { setFrom(today()); setTo(""); }}>Aujourd’hui</button>
          <a
            href={from ? href : undefined}
            className={`btn-primary ${!from ? "pointer-events-none opacity-50" : ""}`}
            aria-disabled={!from}
            onClick={() => { if (from) detailsRef.current?.removeAttribute("open"); }}
          >
            Télécharger le PDF
          </a>
        </div>
      </div>
    </details>
  );
}
