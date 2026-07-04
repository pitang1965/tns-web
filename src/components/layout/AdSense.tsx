'use client';

import Script from 'next/script';
import { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { isPremiumMember } from '@/lib/userUtils';
import { useOrientation } from '@/hooks/useOrientation';
import { NafudaAd } from './NafudaAd';

export function AdSense() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const isAdminPage = pathname.startsWith('/admin');
  const isPremium = isPremiumMember(user);
  const isTopPage = pathname === '/';

  // nafuda対象検索: /shachu-haku で種別がRVパーク/オートキャンプ場のとき、
  // 上部広告枠をAdSenseからnafuda広告に差し替える。詳細はCONTEXT.md参照。
  const spotType = searchParams.get('type');
  const nafudaSpotType =
    pathname === '/shachu-haku' &&
    (spotType === 'rv_park' || spotType === 'auto_campground')
      ? spotType
      : null;
  const { isLandscape } = useOrientation();
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Hide ads on mobile landscape to save screen space and avoid AdSense errors
  const isMobileLandscape =
    isLandscape && typeof window !== 'undefined' && window.innerWidth < 768;

  const isDev = process.env.NODE_ENV === 'development';

  // 共通の非表示条件（管理画面・プレミアム会員・モバイル横向き）。nafuda広告にも適用する。
  if (isAdminPage || isPremium || isMobileLandscape) {
    return null;
  }

  // nafuda対象検索では AdSense の代わりに nafuda広告 を表示（AdSense設定に依存しない）
  if (nafudaSpotType) {
    return <NafudaAd spotType={nafudaSpotType} />;
  }

  // ここから通常の AdSense 配信。表示にはクライアントIDが必要
  if (!process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && !isDev) {
    return null;
  }

  // Wait for client-side detection
  if (isMobile === null) {
    return (
      <div
        className={`w-full bg-background border-b border-gray-200 dark:border-gray-700 ${isTopPage ? 'hidden md:block' : ''}`}
        style={{ height: '100px' }}
      />
    );
  }

  return (
    <div
      className={`w-full bg-background border-b border-gray-200 dark:border-gray-700 ${isTopPage ? 'hidden md:block' : ''}`}
    >
      {isDev ? (
        <div className="flex justify-center py-1">
          <div
            className="bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400"
            style={{
              width: isMobile ? '320px' : '728px',
              height: isMobile ? '100px' : '90px',
            }}
          >
            広告プレースホルダー ({isMobile ? '320x100' : '728x90'})
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-center py-1">
            <ins
              className="adsbygoogle"
              style={{
                display: 'inline-block',
                width: isMobile ? '320px' : '728px',
                height: isMobile ? '100px' : '90px',
              }}
              data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
              data-ad-slot={isMobile ? '9582885398' : '8653673455'}
              data-full-width-responsive="false"
            />
          </div>
          <Script id="adsense-push-header" strategy="lazyOnload">
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
