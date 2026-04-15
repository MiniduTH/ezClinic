import { redirect } from 'next/navigation';

export default function PatientDashboardRedirectPage() {
  redirect('/profile');
}
