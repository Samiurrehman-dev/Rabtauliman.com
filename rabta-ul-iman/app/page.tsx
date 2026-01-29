import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to donor login page
  redirect('/donor/login');
}
