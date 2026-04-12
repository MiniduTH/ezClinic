import { redirect } from 'next/navigation';

// Redirect to Auth0 Universal Login with screen_hint=signup to show the sign-up tab
export default function RegisterPage() {
  redirect('/auth/login?screen_hint=signup');
}
