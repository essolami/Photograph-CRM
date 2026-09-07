function Block({ className = "" }: { className?: string }) { return <div className={`animate-pulse rounded-xl bg-slate-200/70 ${className}`} />; }
export default function TogesLoading() {
  return <div><Block className="h-3 w-40" /><Block className="mt-4 h-10 w-48" /><Block className="mt-3 h-4 w-80" /><div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4"><Block className="h-10 w-full" /></div><div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white"><Block className="h-14 w-full rounded-none" />{[1,2,3,4].map((item) => <Block key={item} className="m-5 h-12" />)}</div></div>;
}
