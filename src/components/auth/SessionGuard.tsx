'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function SessionGuard() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only monitor sessions on protected pages
    const isProtectedPage = pathname.startsWith('/admin') || pathname.startsWith('/faculty');
    if (!isProtectedPage) return;

    const checkSession = async () => {
      try {
        const res = await fetch('/api/me', { cache: 'no-store' });
        if (res.status === 401) {
          // Session is invalid or superseded!
          router.push('/login?reason=superseded');
        }
      } catch (error) {
        // Network error, ignore or handle as needed
      }
    };

    // Check every 10 seconds
    const interval = setInterval(checkSession, 10000);
    
    // Also check on tab focus (user comes back to the site)
    window.addEventListener('focus', checkSession);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', checkSession);
    };
  }, [pathname, router]);

  return null;
}
