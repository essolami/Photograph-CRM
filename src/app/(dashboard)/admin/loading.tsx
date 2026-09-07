function Block({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200/70 ${className}`} />;
}

export default function AdminLoading() {
  return <div className="max-w-6xl" aria-busy="true" aria-label="Chargement de l’administration">
    <Block className="h-3 w-28" />
    <Block className="mt-4 h-10 w-72" />
    <Block className="mt-3 h-4 w-96 max-w-full" />
    <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5"><Block className="h-6 w-44" /><Block className="mt-3 h-10 w-full" /></div>
    <div className="mt-8 space-y-4">{[1, 2, 3].map((item) => <div key={item} className="h-24 rounded-2xl border border-slate-200 bg-white p-5"><Block className="h-5 w-52" /><Block className="mt-3 h-3 w-72" /></div>)}</div>
  </div>;
}
