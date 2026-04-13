import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { withRolesOnUser } from "@/lib/roles";

console.log("Auth0 config check:", {
  hasSecret: !!process.env.AUTH0_SECRET,
  hasDomain: !!process.env.AUTH0_DOMAIN,
  hasClientId: !!process.env.AUTH0_CLIENT_ID,
});

export const auth0 = new Auth0Client({
  domain: process.env.AUTH0_DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  secret: process.env.AUTH0_SECRET,
  appBaseUrl: process.env.APP_BASE_URL,
  authorizationParameters: {
    audience: process.env.AUTH0_AUDIENCE || "https://api.ezclinic.com",
    scope: "openid profile email",
  },
  beforeSessionSaved: async (session) => withRolesOnUser(session),
});

export async function getSessionWithRoles() {
  const session = await auth0.getSession();
  if (!session) return null;

  const updatedSession = withRolesOnUser(session);
  const hasChanged =
    JSON.stringify(updatedSession.user) !== JSON.stringify(session.user);

  if (hasChanged) {
    await auth0.updateSession(updatedSession);
    return updatedSession;
  }

  return session;
}
