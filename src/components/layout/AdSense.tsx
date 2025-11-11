'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { isPremiumMember } from '@/lib/userUtils';
import { useState, useEffect } from 'react';

export function AdSense() {
  const pathname = usePathname();
  const { user } = useUser();
  const isAdminPage = pathname.startsWith('/admin');
  const isPremium = isPremiumMember(user);
  const isTopPage = pathname === '/';
  const [isLandscape, setIsLandscape] = useState(false);

  // Detect screen orientation (landscape vs portrait)
  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    // Initial check
    checkOrientation();

    // Listen for resize and orientation change events
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // Hide ads on mobile landscape to save screen space and avoid AdSense errors
  const isMobileLandscape = isLandscape && typeof window !== 'undefined' && window.innerWidth < 768;

  if (isAdminPage || isPremium || !process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || isMobileLandscape) {
    return null;
  }

  return (
    <div className={`w-full bg-background border-b border-gray-200 dark:border-gray-700 ${isTopPage ? 'hidden md:block' : ''}`}>
      <div className='container mx-auto px-2 py-0.5'>
        <div className='w-full max-w-screen-lg mx-auto'>
          <ins
            className='adsbygoogle'
            style={{ display: 'block', minHeight: '50px', maxHeight: '80px' }}
            data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
            data-ad-format='auto'
            data-full-width-responsive='true'
          />
          <Script id='adsense-push-header' strategy='lazyOnload'>
            {`
              try {
                if (typeof window !== 'undefined' && window.adsbygoogle) {
                  const ads = document.querySelectorAll('.adsbygoogle');
                  ads.forEach((ad) => {
                    // Only push if not already initialized
                    if (!ad.getAttribute('data-adsbygoogle-status')) {
                      (adsbygoogle = window.adsbygoogle || []).push({});
                    }
                  });
                }
              } catch (err) {
                // Silently ignore AdSense errors in development
                if (process.env.NODE_ENV !== 'production') {
                  console.debug('AdSense:', err.message);
                }
              }
            `}
          </Script>
        </div>
      </div>
    </div>
  );
}
