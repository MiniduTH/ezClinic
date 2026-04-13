export const ROLES_CLAIM = "https://ezclinic.com/roles";

type TokenSetLike = {
  accessToken?: string;
  idToken?: string;
};

type RoleSource = {
  sub?: string;
  user?: RoleSource;
  tokenSet?: TokenSetLike;
  [ROLES_CLAIM]?: unknown;
};

function parseRoles(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((role): role is string => typeof role === "string");
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

  if (typeof atob === "function") {
    return atob(padded);
  }

  return Buffer.from(padded, "base64").toString("utf8");
}

function getRolesFromToken(token?: string): string[] {
  if (!token) return [];

  try {
    const [, payload] = token.split(".");
    if (!payload) return [];

    const decoded = JSON.parse(decodeBase64Url(payload)) as Record<string, unknown>;
    return parseRoles(decoded[ROLES_CLAIM]);
  } catch {
    return [];
  }
}

export function getRoles(source: RoleSource | undefined | null): string[] {
  if (!source) return [];

  const directRoles = parseRoles(source[ROLES_CLAIM]);
  if (directRoles.length > 0) return directRoles;

  const nestedRoles = parseRoles(source.user?.[ROLES_CLAIM]);
  if (nestedRoles.length > 0) return nestedRoles;

  const idTokenRoles = getRolesFromToken(source.tokenSet?.idToken);
  if (idTokenRoles.length > 0) return idTokenRoles;

  return getRolesFromToken(source.tokenSet?.accessToken);
}

export function getUserRole(source: RoleSource | undefined | null): string {
  if (!source) return "unauthorized";

  const roles = getRoles(source);

  if (roles.includes("admin")) return "admin";
  if (roles.includes("doctor")) return "doctor";
  if (roles.includes("patient")) return "patient";

  return "patient";
}

export function withRolesOnUser<T extends { user: Record<string, unknown>; tokenSet?: TokenSetLike }>(
  session: T
): T {
  const roles = getRoles(session);
  if (roles.length === 0) return session;

  return {
    ...session,
    user: {
      ...session.user,
      [ROLES_CLAIM]: roles,
    },
  };
}
