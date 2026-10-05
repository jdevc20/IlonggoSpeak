"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pagination } from "@/components/Pagination";
import { SentenceService } from "@/services/sentenceService";
import type { Sentence } from "@/types/sentence";
import type { PaginationMeta } from "@/types/pagination";

const PAGE_SIZE = 20;

export function WorkflowList({
  statuses,
  emptyMessage,
}: {
  statuses: string[];
  emptyMessage: string;
}) {
  const statusKey = statuses.join(",");
  const [items, setItems] = useState<Sentence[]>([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: PAGE_SIZE,
    totalPages: 1,
    hasPrevious: false,
    hasNext: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [statusKey]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await SentenceService.list({
          status: statusKey || undefined,
          page,
          limit: PAGE_SIZE,
        });
        setItems(response.items ?? []);
        setMeta(response.meta);
      } catch {
        setError("Could not load workflow records.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [statusKey, page]);

  if (error) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  }

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {loading ? (
          <div className="py-12 text-center text-sm text-zinc-500">Loading records…</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-sm text-zinc-500">{emptyMessage}</div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {items.map((item) => (
              <Link
                key={item.id}
                href={"/sentences/" + item.id}
                className="grid gap-3 p-5 transition hover:bg-zinc-50 dark:hover:bg-zinc-950 sm:grid-cols-[1fr_1fr_160px]"
              >
                <div>
                  <p className="font-semibold">{item.english}</p>
                  <p className="mt-1 text-xs text-zinc-400">English</p>
                </div>
                <div>
                  <p className="font-bold text-blue-700 dark:text-blue-400">{item.hiligaynon}</p>
                  <p className="mt-1 text-xs text-zinc-400">Hiligaynon</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-sm font-semibold capitalize">{item.status}</p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {item.createdBy || "legacy import"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5">
        <Pagination
          page={page}
          totalPages={meta.totalPages}
          onPageChange={setPage}
          disabled={loading}
        />
      </div>
    </div>
  );
}
