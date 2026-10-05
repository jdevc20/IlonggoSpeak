"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { useAuth } from "@/contexts/AuthContext";
import { SentenceService } from "@/services/sentenceService";
import type { Sentence } from "@/types/sentence";

const getVisiblePages = (current: number, total: number) => {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  if (current <= 3) return [1, 2, 3, 4, "...", total];
  if (current >= total - 2) return [1, "...", total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
};

const statusClass = (status: Sentence["status"]) => {
  if (status === "verified") return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
  if (status === "approved") return "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300";
  if (status === "rejected") return "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300";
  return "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
};

export default function SentencesPage() {
  const { session } = useAuth();
  const canDelete = session?.user.role === "ADMIN";

  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 24;
  const [meta, setMeta] = useState({ total: 0, skip: 0, take: limit });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => setPage(1), [statusFilter]);

  const loadSentences = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await SentenceService.list({
        page,
        limit,
        search: debouncedSearch || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      setSentences(Array.isArray(response.items) ? response.items : []);
      setMeta(response.meta ?? { total: 0, skip: 0, take: limit });
      setSelectedIds([]);
    } catch (err) {
      console.error("Failed to fetch corpus:", err);
      setError("Could not load the team translation corpus.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter]);

  useEffect(() => {
    void loadSentences();
  }, [loadSentences]);

  const totalPages = Math.max(1, Math.ceil(meta.total / limit));
  const pageNumbers = useMemo(
    () => getVisiblePages(page, totalPages),
    [page, totalPages]
  );

  const remove = async (id: string) => {
    if (!canDelete || !window.confirm("Delete this translation record?")) return;
    try {
      setDeletingId(id);
      await SentenceService.remove(id);
      await loadSentences();
    } catch {
      window.alert("Could not delete the translation.");
    } finally {
      setDeletingId(null);
    }
  };

  const removeSelected = async () => {
    if (
      !canDelete ||
      selectedIds.length === 0 ||
      !window.confirm("Delete " + selectedIds.length + " selected translations?")
    ) return;

    try {
      setBulkDeleting(true);
      await SentenceService.removeBulk(selectedIds);
      await loadSentences();
    } catch {
      window.alert("Could not delete the selected translations.");
    } finally {
      setBulkDeleting(false);
    }
  };

  const toggleSelection = (id: string) => {
    if (!canDelete) return;
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id]
    );
  };

  const toggleAll = () => {
    if (!canDelete) return;
    setSelectedIds(
      selectedIds.length === sentences.length && sentences.length > 0
        ? []
        : sentences.map((sentence) => sentence.id)
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-100">
      <AppNav />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <header className="flex flex-col gap-5 border-b border-zinc-200 pb-6 dark:border-zinc-800 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">Team corpus</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight">Corpus</h1>
            <p className="mt-2 text-sm text-zinc-500">
              {loading ? "Loading corpus…" : meta.total + " English → Hiligaynon records"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {canDelete && selectedIds.length > 0 && (
              <button
                onClick={removeSelected}
                disabled={bulkDeleting}
                className="h-10 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 disabled:opacity-50"
              >
                {bulkDeleting ? "Deleting…" : "Delete selected (" + selectedIds.length + ")"}
              </button>
            )}
            <Link
              href="/sentences/create"
              className="inline-flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Add translation
            </Link>
          </div>
        </header>

        <section className="mt-6 grid gap-2 md:grid-cols-[minmax(260px,1fr)_220px]">
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search English or Hiligaynon…"
            className="h-11 rounded-xl border border-zinc-300 bg-white px-4 text-sm outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="all">All workflow states</option>
            <option value="pending">Pending review</option>
            <option value="approved">Approved</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </section>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {canDelete && (
            <div className="flex items-center gap-3 border-b border-zinc-100 px-5 py-3 dark:border-zinc-800">
              <input
                type="checkbox"
                checked={sentences.length > 0 && selectedIds.length === sentences.length}
                onChange={toggleAll}
                aria-label="Select all records"
              />
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Language Lead selection
              </span>
            </div>
          )}

          {loading ? (
            <div className="p-12 text-center text-sm text-zinc-500">Loading structured corpus…</div>
          ) : sentences.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-semibold">No translations found.</p>
              <p className="mt-1 text-sm text-zinc-500">Adjust the filter or add a translation.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {sentences.map((sentence) => (
                <article
                  key={sentence.id}
                  className={"grid gap-4 p-5 " + (canDelete ? "lg:grid-cols-[24px_minmax(0,1fr)_180px]" : "lg:grid-cols-[minmax(0,1fr)_180px]")}
                >
                  {canDelete && (
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(sentence.id)}
                      onChange={() => toggleSelection(sentence.id)}
                      aria-label={"Select " + sentence.english}
                    />
                  )}

                  <div className="min-w-0">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="font-semibold">{sentence.english}</p>
                        <p className="mt-1 text-xs text-zinc-400">English source</p>
                      </div>
                      <div>
                        <p className="font-bold text-blue-700 dark:text-blue-400">{sentence.hiligaynon}</p>
                        <p className="mt-1 text-xs text-zinc-400">Hiligaynon target</p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className={"rounded-full px-2.5 py-1 text-xs font-semibold " + statusClass(sentence.status)}>
                        {sentence.status}
                      </span>
                      <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        Created by {sentence.createdBy || "legacy import"}
                      </span>
                      {sentence.domain && (
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700">
                          {sentence.domain}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={"/sentences/" + sentence.id}
                      className="text-sm font-semibold text-blue-600 hover:underline"
                    >
                      Inspect
                    </Link>
                    {canDelete && (
                      <button
                        onClick={() => void remove(sentence.id)}
                        disabled={deletingId === sentence.id}
                        className="text-sm font-medium text-zinc-400 hover:text-red-600 disabled:opacity-40"
                      >
                        {deletingId === sentence.id ? "Deleting…" : "Delete"}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-zinc-500">Page {page} of {totalPages}</p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={page === 1}
              className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900"
            >
              Previous
            </button>
            {pageNumbers.map((item, index) =>
              item === "..." ? (
                <span key={"ellipsis-" + index} className="px-2 text-zinc-400">…</span>
              ) : (
                <button
                  key={item}
                  onClick={() => setPage(Number(item))}
                  className={
                    "h-9 min-w-9 rounded-lg border px-3 text-sm " +
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
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              disabled={page >= totalPages}
              className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900"
            >
              Next
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}
