"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastKind = "success" | "error" | "info";
type Toast = { id: number; message: string; kind: ToastKind };
type ToastApi = { show: (message: string, kind?: ToastKind) => void; success: (message: string) => void; error: (message: string) => void };

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((message: string, kind: ToastKind = "info") => {
    const id = Date.now() + Math.random();
    setToasts(current => [...current, { id, message, kind }]);
    window.setTimeout(() => setToasts(current => current.filter(toast => toast.id !== id)), 4000);
  }, []);
  const success = useCallback((message: string) => show(message, "success"), [show]);
  const error = useCallback((message: string) => show(message, "error"), [show]);
  const api = useMemo(() => ({ show, success, error }), [show, success, error]);
  const remove = (id: number) => setToasts(current => current.filter(toast => toast.id !== id));

  return <ToastContext.Provider value={api}>
    {children}
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3" aria-live="polite" aria-atomic="true">
      {toasts.map(toast => <div key={toast.id} role={toast.kind === "error" ? "alert" : "status"} className={`pointer-events-auto flex items-start gap-3 rounded-xl border bg-white p-4 shadow-xl toast-enter ${toast.kind === "success" ? "border-emerald-200" : toast.kind === "error" ? "border-red-200" : "border-indigo-200"}`}>
        <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-sm font-bold text-white ${toast.kind === "success" ? "bg-emerald-500" : toast.kind === "error" ? "bg-red-500" : "bg-indigo-500"}`}>{toast.kind === "success" ? "✓" : toast.kind === "error" ? "!" : "i"}</span>
        <p className="flex-1 pt-0.5 text-sm font-medium text-slate-700">{toast.message}</p>
        <button onClick={() => remove(toast.id)} aria-label="Dismiss notification" className="text-lg leading-none text-slate-400 hover:text-slate-700">×</button>
      </div>)}
    </div>
  </ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
