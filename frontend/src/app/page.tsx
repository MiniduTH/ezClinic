import { redirect } from 'next/navigation';
import { auth0 } from '@/lib/auth0';
import { getUserRole } from '@/lib/roles';

export default async function Home() {
  const session = await auth0.getSession();
  if (!session) {
    redirect('/auth/login');
  }

  const role = getUserRole(session.user);
  if (role === 'admin') {
    redirect('/admin');
  } else if (role === 'doctor') {
    redirect('/dashboard');
  } else {
    redirect('/profile');
  }
}
