import { auth0 } from '@/lib/auth0';
import { redirect } from 'next/navigation';
import { getUserRole } from '@/lib/roles';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth0.getSession();
  if (!session) {
    redirect('/auth/login');
  }

  const role = getUserRole(session.user);
  if (role !== 'admin') {
    redirect('/');
  }

  return <>{children}</>;
}
