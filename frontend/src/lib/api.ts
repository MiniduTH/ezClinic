import { auth0 } from './auth0';

/**
 * Perform a fetch to the backend passing the user's access token
 */
export async function apiFetch(url: string, options: RequestInit = {}) {
  // Try to get token from server-side session
  const session = await auth0.getSession();
  const token = session?.tokenSet?.accessToken;

  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Set default content type to json if not explicitly handling FormData
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
}
