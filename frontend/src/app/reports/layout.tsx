import { getSessionWithRoles } from '@/lib/auth0';
import { redirect } from 'next/navigation';
import { getUserRole } from '@/lib/roles';

export default async function ReportsLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionWithRoles();
  if (!session) redirect('/auth/login?returnTo=/reports');

  const role = getUserRole(session);
  if (role !== 'patient') redirect('/profile');

  return <>{children}</>;
}
