'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { isPremiumMember } from '@/lib/userUtils';
import { useOrientation } from '@/hooks/useOrientation';

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

  if (
    isAdminPage ||
    isPremium ||
    (!process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && !isDev) ||
    isMobileLandscape
  ) {
    return null;
  }

  return (
    <div
      className={`w-full bg-background border-b border-gray-200 dark:border-gray-700 ${isTopPage ? 'hidden md:block' : ''}`}
    >
      <div className='container mx-auto px-2 py-0.5'>
        <div className='w-full max-w-5xl mx-auto'>
          {isDev ? (
            <div
              className='bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400'
              style={{ width: '728px', height: '80px', maxWidth: '100%' }}
            >
              広告プレースホルダー (728x90)
            </div>
          ) : (
            <>
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
                        if (!ad.getAttribute('data-adsbygoogle-status')) {
                          (adsbygoogle = window.adsbygoogle || []).push({});
                        }
                      });
                    }
                  } catch (err) {
                    // Silently ignore AdSense errors
                  }
                `}
              </Script>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
