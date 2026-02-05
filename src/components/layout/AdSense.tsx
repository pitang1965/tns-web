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
      {isDev ? (
        <>
          {/* Desktop placeholder */}
          <div className='hidden md:flex justify-center py-1'>
            <div
              className='bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400'
              style={{ width: '728px', height: '90px' }}
            >
              広告プレースホルダー (728x90)
            </div>
          </div>
          {/* Mobile placeholder */}
          <div className='flex md:hidden justify-center py-1'>
            <div
              className='bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400'
              style={{ width: '320px', height: '100px' }}
            >
              広告プレースホルダー (320x100)
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Desktop: 728x90 */}
          <div className='hidden md:flex justify-center py-1'>
            <ins
              className='adsbygoogle'
              style={{ display: 'inline-block', width: '728px', height: '90px' }}
              data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
              data-ad-slot='8653673455'
            />
          </div>
          {/* Mobile: 320x100 */}
          <div className='flex md:hidden justify-center py-1'>
            <ins
              className='adsbygoogle'
              style={{ display: 'inline-block', width: '320px', height: '100px' }}
              data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
              data-ad-slot='9582885398'
            />
          </div>
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
  );
}
