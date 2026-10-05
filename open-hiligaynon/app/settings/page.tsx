"use client";

import { AppNav } from "@/components/AppNav";
import { useAuth } from "@/contexts/AuthContext";
import { roleLabel } from "@/lib/auth";

export default function SettingsPage() {
  const { session } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-100">
      <AppNav />
      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <p className="text-sm font-semibold text-blue-600">Workspace configuration</p>
        <h1 className="mt-2 text-3xl font-black">Settings</h1>

        <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-black">Current team session</h2>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div><dt className="text-xs uppercase tracking-wider text-zinc-400">Name</dt><dd className="mt-1 font-semibold">{session?.user.name}</dd></div>
            <div><dt className="text-xs uppercase tracking-wider text-zinc-400">Username</dt><dd className="mt-1 font-semibold">{session?.user.username}</dd></div>
            <div><dt className="text-xs uppercase tracking-wider text-zinc-400">Role</dt><dd className="mt-1 font-semibold">{session ? roleLabel(session.user.role) : "—"}</dd></div>
            <div><dt className="text-xs uppercase tracking-wider text-zinc-400">Account source</dt><dd className="mt-1 font-semibold">API environment</dd></div>
          </dl>
        </section>

        <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-black">Deployment settings</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Account changes are intentionally not editable in the browser. Update TEAM_ACCOUNTS_JSON, TEAM_AUTH_SECRET, session TTL, and CORS_ORIGINS in your deployment environment.
          </p>
        </section>
      </main>
    </div>
  );
}
