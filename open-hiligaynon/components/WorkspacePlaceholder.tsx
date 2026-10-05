"use client";

import { AppNav } from "@/components/AppNav";

export function WorkspacePlaceholder({
  eyebrow,
  title,
  description,
  items,
}: {
  eyebrow: string;
  title: string;
  description: string;
  items: string[];
}) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-100">
      <AppNav />
      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-3xl leading-7 text-zinc-600 dark:text-zinc-400">{description}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item} className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="font-semibold">{item}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-dashed border-zinc-300 bg-white/60 p-6 text-sm leading-6 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/50">
          This workspace is intentionally separated from corpus review so the future ML service can be integrated without coupling model execution to the translation editor.
        </div>
      </main>
    </div>
  );
}
