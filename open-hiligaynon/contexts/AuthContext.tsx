"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getStoredTeamSession,
  loginTeamAccount,
  storeTeamSession,
  TEAM_SESSION_EVENT,
  type TeamSession,
} from "@/lib/auth";

interface AuthContextValue {
  session: TeamSession | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<TeamSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSession(getStoredTeamSession());
    setLoading(false);

    const onSession = (event: Event) => {
      const custom = event as CustomEvent<TeamSession | null>;
      setSession(custom.detail);
    };

    window.addEventListener(TEAM_SESSION_EVENT, onSession);
    return () => window.removeEventListener(TEAM_SESSION_EVENT, onSession);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      loading,
      signIn: async (username, password) => {
        const next = await loginTeamAccount(username, password);
        setSession(next);
      },
      signOut: () => {
        storeTeamSession(null);
        setSession(null);
      },
    }),
    [session, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return value;
}
