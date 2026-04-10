import { redirect } from 'next/navigation';

export default function Home() {
  // Automatically connect and forward traffic to our new premium Doctor Dashboard!
  redirect('/dashboard');
}
