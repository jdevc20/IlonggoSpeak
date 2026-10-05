"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { signIn } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError(null);
      await signIn(username.trim(), password);
    } catch (err: any) {
      setError(
        err?.response?.data?.details ||
          "Unable to sign in. Check your team username and password."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 px-4 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 font-black text-white">
            IS
          </span>
          <div>
            <h1 className="text-xl font-black">Ilonggo Speak</h1>
            <p className="text-xs text-zinc-500">Team language workspace</p>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-7 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            Team access
          </p>
          <h2 className="mt-1 text-3xl font-black tracking-tight">Sign in</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Accounts are managed by the Language Lead through the server environment configuration.
          </p>

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-sm font-semibold">
              Username
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                required
                className="mt-2 h-12 w-full rounded-xl border border-zinc-300 bg-white px-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>

            <label className="block text-sm font-semibold">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                className="mt-2 h-12 w-full rounded-xl border border-zinc-300 bg-white px-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="h-12 w-full rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Signing in…" : "Sign in to workspace"}
            </button>
          </form>

          <div className="mt-6 border-t border-zinc-100 pt-4 text-xs leading-5 text-zinc-500 dark:border-zinc-800">
            No public registration is available. Contributor, Reviewer, and Language Lead accounts are provisioned in the API environment.
          </div>
        </div>
      </div>
    </main>
  );
}
