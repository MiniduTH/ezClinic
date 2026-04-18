import { decodeJwt as joseDecodeJwt, jwtVerify, type JWTPayload } from 'jose';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'ezclinic_session';
const ROLES_CLAIM = 'https://ezclinic.com/roles' as const;

export interface SessionUser {
  sub: string;
  email: string;
  name: string;
  role: string;
  'https://ezclinic.com/roles'?: string[];
  [key: string]: unknown;
}

export interface Session {
  user: SessionUser;
  tokenSet: { accessToken: string };
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return new TextEncoder().encode(secret);
}

/**
 * Build a Session object from a verified JWT payload.
 */
function buildSession(payload: JWTPayload, token: string): Session {
  const roles = Array.isArray(payload[ROLES_CLAIM])
    ? (payload[ROLES_CLAIM] as string[])
    : payload['role']
    ? [payload['role'] as string]
    : [];

  const user: Session['user'] = {
    sub: payload.sub ?? '',
    email: (payload['email'] as string) ?? '',
    name: (payload['name'] as string) ?? '',
    role: (payload['role'] as string) ?? '',
    [ROLES_CLAIM]: roles,
  };

  return { user, tokenSet: { accessToken: token } };
}

/**
 * Get the current session from the httpOnly session cookie.
 * Returns null if no session or token is invalid/expired.
 */
export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret);
    return buildSession(payload, token);
  } catch {
    return null;
  }
}

export async function getSessionWithRoles(): Promise<Session | null> {
  return getSession();
}

/**
 * Set the session cookie after successful login.
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

/**
 * Clear the session cookie on logout.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

/**
 * Get raw token from cookie (used by /api/auth/token route).
 * Validates the token using jwtVerify before returning it.
 */
export async function getTokenFromCookie(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    // Use jwtVerify to validate signature and expiry
    const secret = getSecret();
    await jwtVerify(token, secret);
    return token;
  } catch {
    return null;
  }
}
