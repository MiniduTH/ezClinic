import { redirect } from 'next/navigation';

// Auth0 handles the login UI — redirect to the Auth0 Universal Login page
export default function LoginPage() {
  redirect('/api/auth/login');
}
