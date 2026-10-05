"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { Pagination } from "@/components/Pagination";
import { useAuth } from "@/contexts/AuthContext";
import {
  createMaintenanceOption,
  deleteMaintenanceOption,
  getMaintenanceOptions,
  updateMaintenanceOption,
} from "@/lib/maintenance";
import {
  MAINTENANCE_CATEGORY_LABELS,
  type MaintenanceCategory,
  type MaintenanceOption,
} from "@/types/maintenance";
import type { PaginationMeta } from "@/types/pagination";

const categories = Object.keys(MAINTENANCE_CATEGORY_LABELS) as MaintenanceCategory[];
const PAGE_SIZE = 20;

type Draft = Pick<
  MaintenanceOption,
  "label" | "value" | "description" | "sortOrder" | "active" | "isDefault"
>;

export default function MaintenancePage() {
  const { session } = useAuth();
  const [category, setCategory] = useState<MaintenanceCategory>("intent");
  const [items, setItems] = useState<MaintenanceOption[]>([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: PAGE_SIZE,
    totalPages: 1,
    hasPrevious: false,
    hasNext: false,
  });
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("100");
  const [isDefault, setIsDefault] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (session?.user.role !== "ADMIN") return;

    try {
      setLoading(true);
      setError(null);
      const response = await getMaintenanceOptions({
        category,
        includeInactive: true,
        page,
        limit: PAGE_SIZE,
      });
      setItems(response.items);
      setMeta(response.meta);
      setDrafts(
        Object.fromEntries(
          response.items.map((item) => [
            item.id,
            {
              label: item.label,
              value: item.value,
              description: item.description,
              sortOrder: item.sortOrder,
              active: item.active,
              isDefault: item.isDefault,
            },
          ])
        )
      );
    } catch (err: any) {
      setError(err?.response?.data?.details || "Could not load maintenance options.");
    } finally {
      setLoading(false);
    }
  }, [session?.user.role, category, page]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [category]);

  if (!session) return null;

  if (session.user.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-100">
        <AppNav />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-black">Language Lead access required</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Only the Admin / Language Lead can maintain controlled metadata values.
          </p>
        </main>
      </div>
    );
  }

  const create = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setBusy(true);
      setError(null);
      setMessage(null);
      await createMaintenanceOption({
        category,
        code,
        label,
        value,
        description: description || null,
        sortOrder: Number.parseInt(sortOrder || "0", 10),
        active: true,
        isDefault,
      });
      setCode("");
      setLabel("");
      setValue("");
      setDescription("");
      setSortOrder("100");
      setIsDefault(false);
      if (page !== 1) setPage(1);
      else await load();
      setMessage("Maintenance option added.");
    } catch (err: any) {
      setError(err?.response?.data?.details || "Could not add maintenance option.");
    } finally {
      setBusy(false);
    }
  };

  const save = async (item: MaintenanceOption) => {
    const draft = drafts[item.id];
    if (!draft) return;

    try {
      setBusy(true);
      setError(null);
      setMessage(null);
      await updateMaintenanceOption(item.id, draft);
      await load();
      setMessage("Maintenance option updated.");
    } catch (err: any) {
      setError(err?.response?.data?.details || "Could not update maintenance option.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (item: MaintenanceOption) => {
    if (!window.confirm(`Delete "${item.label}" from ${MAINTENANCE_CATEGORY_LABELS[item.category]}?`)) {
      return;
    }

    try {
      setBusy(true);
      setError(null);
      setMessage(null);
      await deleteMaintenanceOption(item.id);
      if (items.length === 1 && page > 1) setPage((current) => current - 1);
      else await load();
      setMessage("Maintenance option deleted.");
    } catch (err: any) {
      setError(err?.response?.data?.details || "Could not delete maintenance option.");
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950";

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-100">
      <AppNav />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <header className="border-b border-zinc-200 pb-6 dark:border-zinc-800">
          <p className="text-sm font-semibold text-blue-600">Language Lead administration</p>
          <h1 className="mt-1 text-3xl font-black">Metadata Maintenance</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
            Maintain the controlled vocabulary used by corpus contribution and review forms.
            Disabling an option removes it from new selections without changing historical records.
          </p>
        </header>

        {(error || message) && (
          <div className={"mt-5 rounded-xl border p-4 text-sm " + (error
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-emerald-200 bg-emerald-50 text-emerald-700")}>
            {error || message}
          </div>
        )}

        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={
                "shrink-0 rounded-lg px-3 py-2 text-sm font-semibold " +
                (category === item
                  ? "bg-blue-600 text-white"
                  : "border border-zinc-200 bg-white text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300")
              }
            >
              {MAINTENANCE_CATEGORY_LABELS[item]}
            </button>
          ))}
        </div>

        <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-black">Add {MAINTENANCE_CATEGORY_LABELS[category]}</h2>
          <form onSubmit={create} className="mt-4 grid gap-3 lg:grid-cols-6">
            <input className={inputClass} value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code, e.g. greeting" required />
            <input className={inputClass} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Display label" required />
            <input className={inputClass} value={value} onChange={(e) => setValue(e.target.value)} placeholder="Stored value" required />
            <input className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
            <input className={inputClass} type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} placeholder="Sort order" />
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
                Default
              </label>
              <button disabled={busy} className="ml-auto rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                Add
              </button>
            </div>
          </form>
        </section>

        <section className="mt-5 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
            <h2 className="font-black">{MAINTENANCE_CATEGORY_LABELS[category]} options</h2>
            <p className="mt-1 text-xs text-zinc-500">
              {loading ? "Loading…" : meta.total + " configured value" + (meta.total === 1 ? "" : "s")}
            </p>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-zinc-500">Loading maintenance values…</div>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {items.map((item) => {
                const draft = drafts[item.id] ?? {
                  label: item.label,
                  value: item.value,
                  description: item.description,
                  sortOrder: item.sortOrder,
                  active: item.active,
                  isDefault: item.isDefault,
                };

                const setDraft = (patch: Partial<Draft>) =>
                  setDrafts((current) => ({
                    ...current,
                    [item.id]: { ...draft, ...patch },
                  }));

                return (
                  <div key={item.id} className="p-5">
                    <div className="grid gap-3 lg:grid-cols-[180px_1fr_1fr_1.5fr_100px]">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Code</p>
                        <p className="mt-2 break-all text-sm font-mono">{item.code}</p>
                      </div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                        Label
                        <input className={"mt-2 " + inputClass} value={draft.label} onChange={(e) => setDraft({ label: e.target.value })} />
                      </label>
                      <label className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                        Value
                        <input className={"mt-2 " + inputClass} value={draft.value} onChange={(e) => setDraft({ value: e.target.value })} />
                      </label>
                      <label className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                        Description
                        <input className={"mt-2 " + inputClass} value={draft.description ?? ""} onChange={(e) => setDraft({ description: e.target.value || null })} />
                      </label>
                      <label className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                        Order
                        <input className={"mt-2 " + inputClass} type="number" value={draft.sortOrder} onChange={(e) => setDraft({ sortOrder: Number(e.target.value) })} />
                      </label>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-4">
                      <label className="flex items-center gap-2 text-sm font-semibold">
                        <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ active: e.target.checked })} />
                        Active
                      </label>
                      <label className="flex items-center gap-2 text-sm font-semibold">
                        <input type="checkbox" checked={draft.isDefault} onChange={(e) => setDraft({ isDefault: e.target.checked })} />
                        Default
                      </label>
                      <div className="ml-auto flex gap-2">
                        <button type="button" disabled={busy} onClick={() => void save(item)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                          Save
                        </button>
                        <button type="button" disabled={busy} onClick={() => void remove(item)} className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 disabled:opacity-50">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {items.length === 0 && (
                <div className="p-10 text-center text-sm text-zinc-500">
                  No options configured for this category.
                </div>
              )}
            </div>
          )}
        </section>

        {!error && meta.total > 0 && (
          <div className="mt-5">
            <Pagination
              page={page}
              totalPages={meta.totalPages}
              onPageChange={setPage}
              disabled={loading || busy}
            />
          </div>
        )}
      </main>
    </div>
  );
}
