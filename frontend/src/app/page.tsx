import { redirect } from 'next/navigation';
import { getSessionWithRoles } from '@/lib/auth0';
import { getUserRole } from '@/lib/roles';

export default async function Home() {
  const session = await getSessionWithRoles();
  if (!session) {
    redirect('/auth/login');
  }

  const role = getUserRole(session);
  if (role === 'admin') {
    redirect('/dashboard/admin');
  } else if (role === 'doctor') {
    redirect('/dashboard/doctor');
  } else {
    redirect('/dashboard/patient');
  }
}
