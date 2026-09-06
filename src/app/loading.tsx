import Image from "next/image";

const columns = ["Client", "Soutenance", "Prestation", "Photographe", "Total", "Actions"];

export default function Loading() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-64 shrink-0 flex-col bg-gradient-to-b from-[#242450] via-[#1b2140] to-[#11182c] px-5 py-7 lg:flex">
        <div className="flex items-center gap-3 px-2">
          <div className="relative h-11 w-11 overflow-hidden rounded-xl bg-black shadow-lg">
            <Image src="/Graduation-logo.jpg" alt="Graduation.ma" fill sizes="44px" className="object-cover" />
          </div>
          <div>
            <p className="font-extrabold tracking-tight text-white">Graduation</p>
            <p className="text-[10px] font-semibold tracking-[0.2em] text-indigo-200/70 uppercase">Studio photographique</p>
          </div>
        </div>
        <div className="mt-12 space-y-2">
          <div className="rounded-xl bg-indigo-500 px-3 py-3 text-sm font-bold text-white">Clients</div>
          <div className="rounded-xl px-3 py-3 text-sm font-semibold text-indigo-100/50">Paramètres</div>
          <div className="rounded-xl px-3 py-3 text-sm font-semibold text-indigo-100/50">Utilisateurs et accès</div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 sm:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-[11px] font-bold tracking-[0.16em] text-indigo-500 uppercase">Gestion du studio</p>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Clients</h1>
              <p className="mt-3 text-sm text-slate-500">Préparation de votre espace de travail…</p>
            </div>
            <div className="hidden rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white/80 sm:block">Chargement…</div>
          </div>

          <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <div className="h-10 min-w-64 flex-1 rounded-lg border border-slate-200 bg-slate-50" />
              <div className="h-10 w-36 rounded-xl border border-slate-200 bg-white" />
              <div className="h-10 w-32 rounded-xl border border-slate-200 bg-white" />
              <div className="h-10 w-10 rounded-xl bg-indigo-100" />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-[0_8px_30px_rgba(79,70,229,0.06)]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-indigo-100 bg-indigo-50/80 text-indigo-800">
                <tr>
                  {columns.map((column) => (
                    <th key={column} className="px-4 py-3 text-xs font-bold uppercase">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, row) => (
                  <tr key={row} className="border-b border-slate-100 last:border-0">
                    {columns.map((column) => (
                      <td key={column} className="px-4 py-6">
                        <div className={`h-5 animate-pulse rounded bg-slate-100 ${column === "Client" ? "w-36" : "w-24"}`} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-center text-xs font-semibold text-slate-400">Connexion sécurisée à votre espace…</p>
        </div>
      </main>
    </div>
  );
}
