"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, loading } = useAuth();
  const isLogin = pathname === "/login";

  useEffect(() => {
    if (loading) return;

    if (!session && !isLogin) {
      router.replace("/login");
    } else if (session && isLogin) {
      router.replace("/");
    }
  }, [isLogin, loading, router, session]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-zinc-50 text-sm text-zinc-500 dark:bg-zinc-950">
        Loading Ilonggo Speak…
      </div>
    );
  }

  if ((!session && !isLogin) || (session && isLogin)) {
    return null;
  }

  return children;
}
