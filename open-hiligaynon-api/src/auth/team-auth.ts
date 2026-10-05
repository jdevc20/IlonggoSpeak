import { createHash, createHmac, timingSafeEqual } from "crypto";

export type TeamRole = "CONTRIBUTOR" | "REVIEWER" | "ADMIN";

export interface TeamUser {
  id: string;
  name: string;
  username: string;
  role: TeamRole;
}

interface TeamAccount extends TeamUser {
  password: string;
}

interface TeamTokenPayload extends TeamUser {
  exp: number;
}

const ROLES = new Set<TeamRole>(["CONTRIBUTOR", "REVIEWER", "ADMIN"]);

const getSecret = () => {
  const secret = process.env.TEAM_AUTH_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error("TEAM_AUTH_SECRET must be configured with at least 32 characters.");
  }
  return secret;
};

const parseAccounts = (): TeamAccount[] => {
  const raw = process.env.TEAM_ACCOUNTS_JSON?.trim();
  if (!raw) {
    throw new Error("TEAM_ACCOUNTS_JSON is not configured.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("TEAM_ACCOUNTS_JSON must be valid JSON.");
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("TEAM_ACCOUNTS_JSON must contain at least one team account.");
  }

  return parsed.map((item, index) => {
    const value = item as Partial<TeamAccount>;
    const username = String(value.username ?? "").trim().toLowerCase();
    const password = String(value.password ?? "");
    const name = String(value.name ?? "").trim();
    const role = String(value.role ?? "").trim().toUpperCase() as TeamRole;
    const id = String(value.id ?? username).trim();

    if (!id || !username || !password || !name || !ROLES.has(role)) {
      throw new Error(
        `Invalid team account at index ${index}. Each account needs id, name, username, password, and role.`
      );
    }

    return { id, name, username, password, role };
  });
};

const hashComparable = (value: string) =>
  createHash("sha256").update(value).digest();

const safePasswordEquals = (left: string, right: string) =>
  timingSafeEqual(hashComparable(left), hashComparable(right));

export const authenticateTeamAccount = (
  username: string,
  password: string
): TeamUser | null => {
  const normalizedUsername = username.trim().toLowerCase();
  const account = parseAccounts().find(
    (candidate) => candidate.username === normalizedUsername
  );

  if (!account || !safePasswordEquals(account.password, password)) {
    return null;
  }

  const { password: _password, ...user } = account;
  return user;
};

export const listTeamUsers = (): TeamUser[] =>
  parseAccounts().map(({ password: _password, ...user }) => user);

export const signTeamToken = (user: TeamUser) => {
  const ttlHours = Number(process.env.TEAM_SESSION_TTL_HOURS ?? 12);
  const safeTtlHours =
    Number.isFinite(ttlHours) && ttlHours > 0 && ttlHours <= 168 ? ttlHours : 12;

  const payload: TeamTokenPayload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + Math.floor(safeTtlHours * 60 * 60),
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", getSecret())
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
};

export const verifyTeamToken = (token: string): TeamUser => {
  const [encodedPayload, providedSignature] = token.split(".");

  if (!encodedPayload || !providedSignature) {
    throw new Error("Malformed team session token.");
  }

  const expectedSignature = createHmac("sha256", getSecret())
    .update(encodedPayload)
    .digest();

  const actualSignature = Buffer.from(providedSignature, "base64url");

  if (
    actualSignature.length !== expectedSignature.length ||
    !timingSafeEqual(actualSignature, expectedSignature)
  ) {
    throw new Error("Invalid team session token.");
  }

  const payload = JSON.parse(
    Buffer.from(encodedPayload, "base64url").toString("utf8")
  ) as TeamTokenPayload;

  if (
    !payload.id ||
    !payload.name ||
    !payload.username ||
    !ROLES.has(payload.role) ||
    typeof payload.exp !== "number" ||
    payload.exp <= Math.floor(Date.now() / 1000)
  ) {
    throw new Error("Team session token is expired or invalid.");
  }

  const configuredAccount = listTeamUsers().find(
    (account) =>
      account.id === payload.id &&
      account.username === payload.username &&
      account.role === payload.role
  );

  if (!configuredAccount) {
    throw new Error("This team account is no longer configured.");
  }

  return configuredAccount;
};
