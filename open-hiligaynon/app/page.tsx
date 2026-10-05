"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { useAuth } from "@/contexts/AuthContext";
import { roleLabel } from "@/lib/auth";
import { SentenceService } from "@/services/sentenceService";

type Counts = {
  total: number;
  pending: number;
  approved: number;
  verified: number;
};

export default function DashboardPage() {
  const { session } = useAuth();
  const [counts, setCounts] = useState<Counts>({
    total: 0,
    pending: 0,
    approved: 0,
    verified: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [all, pending, approved, verified] = await Promise.all([
          SentenceService.list({ page: 1, limit: 1 }),
          SentenceService.list({ page: 1, limit: 1, status: "pending" }),
          SentenceService.list({ page: 1, limit: 1, status: "approved" }),
          SentenceService.list({ page: 1, limit: 1, status: "verified" }),
        ]);
        setCounts({
          total: all.meta.total,
          pending: pending.meta.total,
          approved: approved.meta.total,
          verified: verified.meta.total,
        });
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const cards = [
    ["Corpus", counts.total],
    ["Pending Review", counts.pending],
    ["Approved", counts.approved],
    ["Verified", counts.verified],
  ];

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-100">
      <AppNav />
      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">Internal language workspace</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
              Dashboard
            </h1>
            <p className="mt-2 text-zinc-500">
              {session ? session.user.name + " · " + roleLabel(session.user.role) : "Ilonggo Speak team"}
            </p>
          </div>
          <Link href="/sentences/create" className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white">
            Add translation
          </Link>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm text-zinc-500">{label}</p>
              <p className="mt-2 text-3xl font-black">{loading ? "—" : value}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-3">
          <Link href="/sentences" className="rounded-2xl border border-zinc-200 bg-white p-6 hover:border-blue-300 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm font-semibold text-blue-600">Corpus</p>
            <h2 className="mt-2 text-xl font-black">Translation workspace</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">Create, inspect, and maintain team-owned English ↔ Hiligaynon records.</p>
          </Link>
          {(session?.user.role === "REVIEWER" || session?.user.role === "ADMIN") && (
            <Link href="/review-queue" className="rounded-2xl border border-zinc-200 bg-white p-6 hover:border-blue-300 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm font-semibold text-blue-600">Review</p>
              <h2 className="mt-2 text-xl font-black">Review Queue</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-500">Review pending translations and move quality-controlled data through the workflow.</p>
            </Link>
          )}
          <Link href="/verified" className="rounded-2xl border border-zinc-200 bg-white p-6 hover:border-blue-300 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm font-semibold text-emerald-600">Training-ready</p>
            <h2 className="mt-2 text-xl font-black">Verified Data</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">Inspect records approved by a reviewer and verified by the Language Lead.</p>
          </Link>
          <Link href="/documentation" className="rounded-2xl border border-zinc-200 bg-white p-6 hover:border-blue-300 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm font-semibold text-blue-600">Project wiki</p>
            <h2 className="mt-2 text-xl font-black">Documentation</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">Understand team roles, data workflow, dataset standards, and the machine-learning roadmap.</p>
          </Link>
        </section>
      </main>
    </div>
  );
}
