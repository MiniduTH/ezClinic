import { getSessionWithRoles } from '@/lib/auth0';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionWithRoles();
  if (!session) {
    redirect('/login');
  }

  // Role validation removed as requested
  
  return <>{children}</>;
}
