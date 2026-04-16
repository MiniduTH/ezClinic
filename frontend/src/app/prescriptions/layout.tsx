import { getSessionWithRoles } from '@/lib/auth0';
import { redirect } from 'next/navigation';
import { getUserRole } from '@/lib/roles';

export default async function PrescriptionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionWithRoles();
  if (!session) {
    redirect('/login');
  }

  const role = getUserRole(session);
  if (role !== 'doctor') {
    redirect('/');
  }

  return <>{children}</>;
}
