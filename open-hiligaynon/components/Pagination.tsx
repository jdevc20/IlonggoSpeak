"use client";

export function Pagination({
  page,
  totalPages,
  onPageChange,
  disabled = false,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}) {
  const safeTotal = Math.max(1, totalPages);
  const visible = (() => {
    if (safeTotal <= 7) {
      return Array.from({ length: safeTotal }, (_, index) => index + 1);
    }
    if (page <= 3) return [1, 2, 3, 4, "...", safeTotal] as const;
    if (page >= safeTotal - 2) {
      return [1, "...", safeTotal - 3, safeTotal - 2, safeTotal - 1, safeTotal] as const;
    }
    return [1, "...", page - 1, page, page + 1, "...", safeTotal] as const;
  })();

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-zinc-500">
        Page {page} of {safeTotal}
      </p>
      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={disabled || page <= 1}
          className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900"
        >
          Previous
        </button>
        {visible.map((item, index) =>
          item === "..." ? (
            <span key={"ellipsis-" + index} className="px-2 text-zinc-400">…</span>
          ) : (
            <button
              type="button"
              key={item}
              disabled={disabled}
              onClick={() => onPageChange(Number(item))}
              className={
                "h-9 min-w-9 rounded-lg border px-3 text-sm disabled:opacity-40 " +
                (item === page
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900")
              }
            >
              {item}
            </button>
          )
        )}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(safeTotal, page + 1))}
          disabled={disabled || page >= safeTotal}
          className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900"
        >
          Next
        </button>
      </div>
    </div>
  );
}
