import { getSessionWithRoles } from '@/lib/auth0';
import { redirect } from "next/navigation";
import { getUserRole } from '@/lib/roles';

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionWithRoles();
  if (!session) {
    redirect('/auth/login');
  }

  const role = getUserRole(session);
  if (role !== 'patient' && role !== 'doctor') {
    redirect('/');
  }

  return <>{children}</>;
}
