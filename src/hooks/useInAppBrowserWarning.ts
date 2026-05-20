import { useState } from 'react';

export function useInAppBrowserWarning() {
  const [showWarning, setShowWarning] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const dismissedDate = localStorage.getItem(
        'inAppBrowserWarningDismissed',
      );
      if (dismissedDate === new Date().toDateString()) return false;
      const userAgent = navigator.userAgent || navigator.vendor;
      return /Twitter|TwitterAndroid|FBAN|FBAV|Instagram|Line|FB_IAB|KAKAOTALK/i.test(
        userAgent,
      );
    } catch {
      return false;
    }
  });

  const handleDismiss = () => {
    setShowWarning(false);
    try {
      // 今日の日付を保存（翌日には再度表示される）
      localStorage.setItem(
        'inAppBrowserWarningDismissed',
        new Date().toDateString(),
      );
    } catch (error) {
      console.error('Failed to save warning state:', error);
    }
  };

  return { showWarning, handleDismiss };
}
