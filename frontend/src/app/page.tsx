import { redirect } from 'next/navigation';
import { getSessionWithRoles } from '@/lib/auth0';
import { getUserRole } from '@/lib/roles';

export default async function Home() {
  const session = await getSessionWithRoles();
  if (!session) {
    redirect('/login');
  }

  const role = getUserRole(session);
  if (role === 'admin') {
    redirect('/admin');
  } else if (role === 'doctor') {
    redirect('/dashboard');
  } else {
    redirect('/profile');
  }
}
