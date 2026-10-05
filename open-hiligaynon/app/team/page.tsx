"use client";

import { useEffect, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { RoleGate } from "@/components/RoleGate";
import { api } from "@/lib/api";
import { roleLabel, type TeamUser } from "@/lib/auth";

export default function TeamPage() {
  const [members, setMembers] = useState<TeamUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get("/auth/team");
        setMembers(response.data?.data ?? []);
      } catch (err: any) {
        setError(err?.response?.data?.details || "Could not load team configuration.");
      }
    };
    void load();
  }, []);

  return (
    <RoleGate roles={["ADMIN"]}>
      <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-100">
        <AppNav />
        <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
          <p className="text-sm font-semibold text-blue-600">Language Lead administration</p>
          <h1 className="mt-2 text-3xl font-black">Team</h1>
          <p className="mt-3 max-w-3xl text-zinc-500">
            Team accounts are static and loaded from TEAM_ACCOUNTS_JSON on the API server. Passwords are never returned to this page.
          </p>

          {error && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

          <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {members.map((member) => (
                <div key={member.id} className="grid gap-2 p-5 sm:grid-cols-[1fr_1fr_180px]">
                  <div>
                    <p className="font-bold">{member.name}</p>
                    <p className="text-xs text-zinc-400">{member.id}</p>
                  </div>
                  <div>
                    <p className="font-medium">@{member.username}</p>
                    <p className="text-xs text-zinc-400">Static environment account</p>
                  </div>
                  <div className="sm:text-right">
                    <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                      {roleLabel(member.role)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </RoleGate>
  );
}
