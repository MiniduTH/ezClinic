import { getSession } from './auth';

/**
 * Perform a fetch to the backend passing the user's access token
 */
export async function apiFetch(url: string, options: RequestInit = {}) {
  const session = await getSession();
  const token = session?.tokenSet?.accessToken;

  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
}
