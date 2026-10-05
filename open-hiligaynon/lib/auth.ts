import axios from "axios";

export type TeamRole = "CONTRIBUTOR" | "REVIEWER" | "ADMIN";

export interface TeamUser {
  id: string;
  name: string;
  username: string;
  role: TeamRole;
}

export interface TeamSession {
  token: string;
  user: TeamUser;
}

const STORAGE_KEY = "ilonggo-speak.team-session";
export const TEAM_SESSION_EVENT = "ilonggo-speak:team-session";

const baseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://hiligaynonengine.onrender.com/api";

const authApi = axios.create({
  baseURL,
  timeout: 15000,
});

export const getStoredTeamSession = (): TeamSession | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TeamSession) : null;
  } catch {
    return null;
  }
};

export const storeTeamSession = (session: TeamSession | null) => {
  if (typeof window === "undefined") return;

  if (session) {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } else {
    window.sessionStorage.removeItem(STORAGE_KEY);
  }

  window.dispatchEvent(
    new CustomEvent(TEAM_SESSION_EVENT, { detail: session })
  );
};

export const loginTeamAccount = async (
  username: string,
  password: string
): Promise<TeamSession> => {
  const response = await authApi.post("/auth/login", { username, password });
  const session = response.data?.data as TeamSession | undefined;

  if (!session?.token || !session.user?.username) {
    throw new Error("The API returned an invalid team session.");
  }

  storeTeamSession(session);
  return session;
};

export const roleLabel = (role: TeamRole) =>
  role === "ADMIN" ? "Language Lead" : role === "REVIEWER" ? "Reviewer" : "Contributor";
