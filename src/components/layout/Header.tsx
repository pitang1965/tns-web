'use client';

import { useState, useEffect, Suspense } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';
import { HelpCircle } from 'lucide-react';
import { LoginButton } from '@/components/auth/LoginButton';
import { ModeToggle } from '@/components/common/ModeToggle';
import { UserAvatar } from '@/components/common/UserAvatar';
import { Navigation } from '@/components/layout/Navigation';
import { BurgerMenu } from '@/components/layout/BurgerMenu';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { useEnvironment } from '@/hooks/useEnvironment';
import { Button } from '@/components/ui/button';

function EnvironmentBadge() {
  const environment = useEnvironment();

  // 開発環境のみバッジを表示
  if (environment === 'development') {
    return (
      <span className='px-2 py-1 text-xs font-bold bg-orange-500 text-white rounded-md'>
        DEV
      </span>
    );
  }

  // 本番環境では何も表示しない
  return null;
}

export function Header() {
  const { user, error, isLoading } = useUser();
  const [isClient, setIsClient] = useState(false);
  const [showInAppWarning, setShowInAppWarning] = useState(false);

  useEffect(() => {
    setIsClient(true);

    // アプリ内ブラウザ警告の表示判定
    try {
      const hasDismissed = localStorage.getItem('inAppBrowserWarningDismissed');
      if (hasDismissed === 'true') return;

      const userAgent = navigator.userAgent || navigator.vendor;
      const isInAppBrowser =
        /Twitter|TwitterAndroid|FBAN|FBAV|Instagram|Line|FB_IAB|KAKAOTALK/i.test(
          userAgent
        );

      if (isInAppBrowser) {
        setShowInAppWarning(true);
      }
    } catch (error) {
      console.error('Failed to check in-app browser:', error);
    }
  }, []);

  // バナー表示時にメインコンテンツの位置を調整
  useEffect(() => {
    if (!showInAppWarning) {
      // バナー非表示時は元の padding に戻す
      const mainElement = document.querySelector('main');
      const contentDiv = mainElement?.querySelector('div');
      if (contentDiv) {
        contentDiv.style.paddingTop = '';
      }
      return;
    }

    // バナーがDOMに追加されるまで少し待つ
    const timer = setTimeout(() => {
      const mainElement = document.querySelector('main');
      const headerElement = document.querySelector('header');
      const bannerElement = document.getElementById(
        'in-app-browser-warning-banner'
      );

      if (!mainElement || !headerElement || !bannerElement) return;

      // ヘッダーの実際の高さを取得
      const headerHeight = headerElement.offsetHeight;

      // バナーの位置をヘッダーの下に設定
      bannerElement.style.top = `${headerHeight}px`;

      // バナーの高さを取得
      const bannerHeight = bannerElement.offsetHeight;

      // メインコンテンツの<div>要素を取得
      const contentDiv = mainElement.querySelector('div');
      if (contentDiv) {
        // 元のpt-12(48px) + バナー高さを設定
        contentDiv.style.paddingTop = `${48 + bannerHeight}px`;
      }
    }, 100);

    // クリーンアップ
    return () => {
      clearTimeout(timer);
      const mainElement = document.querySelector('main');
      const contentDiv = mainElement?.querySelector('div');
      if (contentDiv) {
        contentDiv.style.paddingTop = '';
      }
    };
  }, [showInAppWarning]);

  const handleDismissWarning = () => {
    setShowInAppWarning(false);
    try {
      localStorage.setItem('inAppBrowserWarningDismissed', 'true');
    } catch (error) {
      console.error('Failed to save warning state:', error);
    }
  };

  // Show loading spinner while checking authentication status
  if (isLoading) return <LoadingSpinner />;

  // Handle errors - "Unauthorized" is expected when logged out, so we ignore it
  if (error && error.message !== 'Unauthorized') {
    console.error('[Header] Auth0 useUser error:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      fullError: error,
    });
  }

  return (
    <>
      <header className='fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-50'>
        <div className='flex items-center justify-between text-foreground bg-background p-2 gap-2'>
          <div className='md:hidden'>
            <BurgerMenu />
          </div>
          <Link href='/' className='text-xl ml-auto'>
            車旅のしおり
          </Link>
          <Suspense fallback={null}>
            <EnvironmentBadge />
          </Suspense>
          <div className='flex items-center space-x-4 ml-auto'>
            <div className='hidden md:block'>
              <Navigation />
            </div>

            {isClient && !user && <LoginButton />}
            <Link href='/help'>
              <Button
                variant='ghost'
                size='icon'
                className='hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer'
                aria-label='ヘルプ'
              >
                <HelpCircle className='h-5 w-5' />
              </Button>
            </Link>
            <ModeToggle />
          </div>
          {isClient && user && <UserAvatar user={user} />}
        </div>
      </header>

      {/* アプリ内ブラウザ警告バナー */}
      {showInAppWarning && (
        <div
          id='in-app-browser-warning-banner'
          className='fixed left-0 right-0 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 z-40'
        >
          <div className='max-w-7xl mx-auto px-4 py-3'>
            <div className='flex items-start justify-between gap-3'>
              <div className='flex items-start gap-2 flex-1'>
                <span className='text-yellow-600 dark:text-yellow-500 mt-0.5'>
                  ℹ️
                </span>
                <p className='text-sm text-yellow-800 dark:text-yellow-200'>
                  より快適にご利用いただくため、Safari・Chrome・Edgeなどの通常のブラウザでの閲覧を推奨します。
                </p>
              </div>
              <button
                onClick={handleDismissWarning}
                className='shrink-0 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300 transition-colors p-1 rounded hover:bg-yellow-100 dark:hover:bg-yellow-900/40'
                aria-label='閉じる'
                type='button'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='16'
                  height='16'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <line x1='18' y1='6' x2='6' y2='18' />
                  <line x1='6' y1='6' x2='18' y2='18' />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
