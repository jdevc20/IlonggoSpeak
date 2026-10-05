"use client";

import { AppNav } from "@/components/AppNav";
import { WorkflowList } from "@/components/WorkflowList";

export default function VerifiedDataPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-100">
      <AppNav />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <p className="text-sm font-semibold text-emerald-600">Training-ready corpus</p>
        <h1 className="mt-2 text-3xl font-black">Verified Data</h1>
        <p className="mt-3 max-w-3xl text-zinc-500">
          Only Language Lead-verified translations appear here and are eligible for generated training datasets.
        </p>
        <div className="mt-8">
          <WorkflowList statuses={["verified"]} emptyMessage="No verified translations yet." />
        </div>
      </main>
    </div>
  );
}
