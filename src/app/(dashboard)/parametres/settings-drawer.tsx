"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function SettingsDrawer({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    dialog.querySelector<HTMLInputElement>('input[name="name"]')?.focus();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby="drawer-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const bounds = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          )
            onClose();
        }
      }}
      className={`studio-drawer fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-full ${wide ? "max-w-3xl" : "max-w-lg"} border-0 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/25 backdrop:backdrop-blur-[3px]`}
    >
      <div className="flex h-full flex-col">
        <header
          className={`flex shrink-0 items-center justify-between gap-4 border-b px-7 py-6 ${wide ? "border-indigo-800 bg-gradient-to-r from-indigo-950 to-indigo-800 text-white" : "border-slate-100"}`}
        >
          <h2 id="drawer-title" className="text-xl font-bold tracking-tight">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le panneau"
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm transition ${wide ? "bg-white/10 text-white hover:bg-white/20" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
          >
            ✕
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-7">{children}</div>
      </div>
    </dialog>
  );
}
