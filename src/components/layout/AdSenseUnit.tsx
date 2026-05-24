'use client';

import { useEffect, useRef } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { isPremiumMember } from '@/lib/userUtils';
import { usePathname } from 'next/navigation';

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

type AdSenseUnitProps = {
  slot: string;
  className?: string;
};

export function AdSenseUnit({ slot, className }: AdSenseUnitProps) {
  const adRef = useRef<HTMLModElement>(null);
  const { user } = useUser();
  const pathname = usePathname();
  const isPremium = isPremiumMember(user);
  const isAdminPage = pathname.startsWith('/admin');
  const isDev = process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (isDev || !adRef.current) return;
    try {
      if (!adRef.current.getAttribute('data-adsbygoogle-status')) {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
      }
    } catch {
      // Silently ignore AdSense errors
    }
  }, [isDev]);

  if (isAdminPage || isPremium || (!process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && !isDev)) {
    return null;
  }

  if (isDev) {
    return (
      <div className={`py-2 ${className ?? ''}`}>
        <div className="bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm h-16 rounded w-full">
          広告プレースホルダー (インコンテンツ)
        </div>
      </div>
    );
  }

  return (
    <div className={`py-2 overflow-hidden ${className ?? ''}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
