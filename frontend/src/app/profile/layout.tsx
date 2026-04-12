import { auth0 } from '@/lib/auth0';
import { redirect } from 'next/navigation';
import { getUserRole } from '@/lib/roles';

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth0.getSession();
  if (!session) {
    redirect('/auth/login');
  }

  const role = getUserRole(session.user);
  if (role !== 'patient') {
    redirect('/');
  }

  return <>{children}</>;
}
