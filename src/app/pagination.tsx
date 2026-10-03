"use client";

// Première page, dernière page et les voisines de la page courante.
function pageNumbers(page: number, pageCount: number) {
  const pages = new Set([1, pageCount, page, page - 1, page + 1]);
  if (page <= 3) for (const value of [2, 3, 4]) pages.add(value);
  if (page >= pageCount - 2) for (const value of [pageCount - 3, pageCount - 2, pageCount - 1]) pages.add(value);
  return [...pages].filter((value) => value >= 1 && value <= pageCount).sort((a, b) => a - b);
}

export function Pagination({
  page,
  pageCount,
  start,
  end,
  total,
  noun,
  onPage,
}: {
  page: number;
  pageCount: number;
  start: number;
  end: number;
  total: number;
  noun: string;
  onPage: (page: number) => void;
}) {
  if (!total) return null;
  const numbers = pageNumbers(page, pageCount);
  const arrow = (label: string, target: number, disabled: boolean, path: string) => (
    <button
      type="button"
      className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-indigo-300 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-600"
      aria-label={label}
      disabled={disabled}
      onClick={() => onPage(target)}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2" strokeLinecap="round" strokeLinejoin="round">
        <path d={path} />
      </svg>
    </button>
  );
  return (
    <nav
      aria-label={`Pagination des ${noun}`}
      className="mt-4 flex flex-wrap items-center justify-between gap-3"
    >
      <p role="status" className="text-xs font-semibold text-slate-500">
        {start + 1}–{end} sur {total} {noun}
      </p>
      {pageCount > 1 && (
        <div className="flex items-center gap-1.5">
          {arrow("Page précédente", page - 1, page === 1, "m15 6-6 6 6 6")}
          {numbers.map((value, index) => (
            <span key={value} className="flex items-center gap-1.5">
              {index > 0 && value - numbers[index - 1] > 1 && (
                <span className="px-1 text-xs text-slate-400">…</span>
              )}
              <button
                type="button"
                aria-label={`Page ${value}`}
                aria-current={value === page ? "page" : undefined}
                className={`h-9 min-w-9 rounded-lg px-2 text-sm font-bold tabular-nums transition ${value === page ? "bg-indigo-600 text-white" : "border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-700"}`}
                onClick={() => onPage(value)}
              >
                {value}
              </button>
            </span>
          ))}
          {arrow("Page suivante", page + 1, page === pageCount, "m9 6 6 6-6 6")}
        </div>
      )}
    </nav>
  );
}
