"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AppNav } from "@/components/AppNav";
import { useAuth } from "@/contexts/AuthContext";
import { roleLabel, type TeamRole } from "@/lib/auth";

export function RoleGate({
  roles,
  children,
}: {
  roles: TeamRole[];
  children: ReactNode;
}) {
  const { session } = useAuth();

  if (!session || !roles.includes(session.user.role)) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-100">
        <AppNav />
        <main className="mx-auto w-full max-w-2xl px-4 py-20 sm:px-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm font-semibold text-amber-600">Restricted workspace</p>
            <h1 className="mt-2 text-3xl font-black">Role permission required</h1>
            <p className="mt-3 text-zinc-600 dark:text-zinc-400">
              Your {session ? roleLabel(session.user.role) : "current"} role cannot access this workspace.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
            >
              Return to dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return children;
}
