'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

/**
 * アプリ内ブラウザを検出し、通常のブラウザの使用を推奨するバナーを表示するコンポーネント
 */
export function InAppBrowserWarning() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // 既に閉じた履歴がある場合はスキップ
    try {
      const hasDismissed = localStorage.getItem('inAppBrowserWarningDismissed');
      if (hasDismissed === 'true') return;
    } catch (error) {
      // LocalStorageにアクセスできない環境では無視
      console.error('Failed to access localStorage:', error);
    }

    const userAgent = navigator.userAgent || navigator.vendor;

    // アプリ内ブラウザを検出
    const isInAppBrowser =
      // X (Twitter)
      /Twitter/i.test(userAgent) ||
      /TwitterAndroid/i.test(userAgent) ||
      // Facebook
      /FBAN/i.test(userAgent) ||
      /FBAV/i.test(userAgent) ||
      // Instagram
      /Instagram/i.test(userAgent) ||
      // LINE
      /Line/i.test(userAgent) ||
      // その他のよくあるアプリ内ブラウザ
      /FB_IAB/i.test(userAgent);

    if (isInAppBrowser) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      localStorage.setItem('inAppBrowserWarningDismissed', 'true');
    } catch (error) {
      console.error('Failed to save dismiss state:', error);
    }
  };

  // SSR中やマウント前は何も表示しない
  if (!isMounted || !isVisible) return null;

  return (
    <div className='bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800'>
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
            onClick={handleDismiss}
            className='flex-shrink-0 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300 transition-colors p-1 rounded hover:bg-yellow-100 dark:hover:bg-yellow-900/40'
            aria-label='閉じる'
          >
            <X className='w-4 h-4' />
          </button>
        </div>
      </div>
    </div>
  );
}
