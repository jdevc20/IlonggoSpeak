"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { roleLabel, type TeamRole } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";

type WorkspaceLink = {
  href: string;
  label: string;
  roles?: TeamRole[];
};

const links: WorkspaceLink[] = [
  { href: "/", label: "Dashboard" },
  { href: "/sentences", label: "Corpus" },
  { href: "/dictionary", label: "Dictionary" },
  { href: "/review-queue", label: "Review Queue", roles: ["REVIEWER", "ADMIN"] },
  { href: "/verified", label: "Verified Data" },
  { href: "/datasets", label: "Datasets", roles: ["REVIEWER", "ADMIN"] },
  { href: "/model-training", label: "Model Training", roles: ["ADMIN"] },
  { href: "/model-evaluation", label: "Model Evaluation", roles: ["REVIEWER", "ADMIN"] },
  { href: "/model-versions", label: "Model Versions", roles: ["REVIEWER", "ADMIN"] },
  { href: "/team", label: "Team", roles: ["ADMIN"] },
  { href: "/settings", label: "Settings" },
];

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, signOut } = useAuth();

  if (!session) return null;

  const visibleLinks = links.filter(
    (link) => !link.roles || link.roles.includes(session.user.role)
  );

  const logout = () => {
    signOut();
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto flex min-h-16 w-full max-w-screen-2xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-3 font-semibold tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-sm font-black text-white shadow-sm">
            IS
          </span>
          <span className="hidden text-zinc-900 sm:inline dark:text-zinc-100">
            Ilonggo Speak
          </span>
        </Link>

        <nav
          className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto py-2"
          aria-label="Workspace navigation"
        >
          {visibleLinks.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname === link.href || pathname.startsWith(link.href + "/");

            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  "shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition " +
                  (active
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white")
                }
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 border-l border-zinc-200 pl-4 md:flex dark:border-zinc-800">
          <div className="max-w-40 text-right">
            <p className="truncate text-xs font-bold">{session.user.name}</p>
            <p className="text-[10px] uppercase tracking-wider text-zinc-400">
              {roleLabel(session.user.role)}
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
