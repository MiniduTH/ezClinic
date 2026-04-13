import { getSessionWithRoles } from '@/lib/auth0';
import { redirect } from 'next/navigation';
import { getUserRole } from '@/lib/roles';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionWithRoles();
  if (!session) {
    redirect('/auth/login');
  }

  const role = getUserRole(session);
  if (role !== 'admin') {
    redirect('/');
  }

  return <>{children}</>;
}
