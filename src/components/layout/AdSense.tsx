'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { isPremiumMember } from '@/lib/userUtils';

export function AdSense() {
  const pathname = usePathname();
  const { user } = useUser();
  const isAdminPage = pathname.startsWith('/admin');
  const isPremium = isPremiumMember(user);
  const isTopPage = pathname === '/';

  if (isAdminPage || isPremium || !process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID) {
    return null;
  }

  return (
    <div className={`w-full bg-background border-b border-gray-200 dark:border-gray-700 ${isTopPage ? 'hidden md:block' : ''}`}>
      <div className='container mx-auto px-2 py-0.5'>
        <Script
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}`}
          strategy='afterInteractive'
          crossOrigin='anonymous'
        />
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
                  (adsbygoogle = window.adsbygoogle || []).push({});
                }
              } catch (err) {
                console.error('AdSense initialization error:', err);
              }
            `}
          </Script>
        </div>
      </div>
    </div>
  );
}
