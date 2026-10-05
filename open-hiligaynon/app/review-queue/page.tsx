"use client";

import { AppNav } from "@/components/AppNav";
import { RoleGate } from "@/components/RoleGate";
import { WorkflowList } from "@/components/WorkflowList";

export default function ReviewQueuePage() {
  return (
    <RoleGate roles={["REVIEWER", "ADMIN"]}>
      <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-100">
        <AppNav />
        <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
          <p className="text-sm font-semibold text-blue-600">Quality workflow</p>
          <h1 className="mt-2 text-3xl font-black">Review Queue</h1>
          <p className="mt-3 max-w-3xl text-zinc-500">
            Pending records need reviewer action. Approved records are waiting for final Language Lead verification.
          </p>
          <div className="mt-8">
            <WorkflowList statuses={["pending", "approved"]} emptyMessage="The review queue is clear." />
          </div>
        </main>
      </div>
    </RoleGate>
  );
}
