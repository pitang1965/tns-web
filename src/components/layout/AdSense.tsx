'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { isPremiumMember } from '@/lib/userUtils';
import { useOrientation } from '@/hooks/useOrientation';

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export function AdSense() {
  const pathname = usePathname();
  const { user } = useUser();
  const isAdminPage = pathname.startsWith('/admin');
  const isPremium = isPremiumMember(user);
  const isTopPage = pathname === '/';
  const { isLandscape } = useOrientation();

  // Hide ads on mobile landscape to save screen space and avoid AdSense errors
  const isMobileLandscape =
    isLandscape && typeof window !== 'undefined' && window.innerWidth < 768;

  const isDev = process.env.NODE_ENV === 'development';
  const shouldShowAd =
    !isAdminPage &&
    !isPremium &&
    (process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || isDev) &&
    !isMobileLandscape;

  useEffect(() => {
    if (!shouldShowAd || isDev) return;

    const initAds = () => {
      try {
        const ads = document.querySelectorAll('.adsbygoogle');
        ads.forEach((ad) => {
          // Only push if not already initialized
          if (!ad.getAttribute('data-adsbygoogle-status')) {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
          }
        });
      } catch {
        // Silently ignore AdSense errors
      }
    };

    // Wait for adsbygoogle script to be ready
    if (window.adsbygoogle) {
      initAds();
    } else {
      // Retry after a short delay if script not ready
      const timer = setTimeout(initAds, 500);
      return () => clearTimeout(timer);
    }
  }, [shouldShowAd, pathname, isDev]);

  if (!shouldShowAd) {
    return null;
  }

  return (
    <div
      className={`w-full bg-background border-b border-gray-200 dark:border-gray-700 flex justify-center items-center ${isTopPage ? 'hidden md:block' : ''}`}
      style={{ height: '106px', maxHeight: '120px', overflow: 'hidden' }}
    >
      <div className='w-full flex justify-center'>
        {isDev ? (
          <div
            className='bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400'
            style={{ width: '728px', height: '90px', maxWidth: '100%' }}
          >
            広告プレースホルダー (728x90)
          </div>
        ) : (
          <ins
            className='adsbygoogle'
            style={{ display: 'block' }}
            data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
            data-ad-format='horizontal'
            data-full-width-responsive='true'
          />
        )}
      </div>
    </div>
  );
}
