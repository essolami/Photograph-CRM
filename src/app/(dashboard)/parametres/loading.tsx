function Block({ className = "" }: { className?: string }) { return <div className={`animate-pulse rounded-xl bg-slate-200/70 ${className}`} />; }
export default function SettingsLoading() {
  return <div><Block className="h-3 w-44" /><Block className="mt-4 h-10 w-64" /><Block className="mt-3 h-4 w-[28rem] max-w-full" /><div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5"><Block className="h-12 w-full" />{[1,2,3,4].map((item) => <div key={item} className="mt-4 flex gap-4"><Block className="h-5 w-1/3" /><Block className="h-5 w-1/4" /><Block className="ml-auto h-8 w-16" /></div>)}</div></div>;
}
