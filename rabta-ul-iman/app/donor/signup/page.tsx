'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DonorSignup() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/donor/login');
  }, [router]);

  return null;
}
