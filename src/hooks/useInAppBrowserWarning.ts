import { useState, useEffect } from 'react';

/**
 * アプリ内ブラウザを検出し、警告バナーの表示状態を管理するカスタムフック
 *
 * @returns {Object} 警告バナーの状態と制御関数
 * @returns {boolean} showWarning - バナーを表示するかどうか
 * @returns {() => void} handleDismiss - バナーを閉じる関数
 */
export function useInAppBrowserWarning() {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // アプリ内ブラウザ警告の表示判定
    try {
      const dismissedDate = localStorage.getItem('inAppBrowserWarningDismissed');
      const today = new Date().toDateString();

      // 今日既に閉じている場合はスキップ
      if (dismissedDate === today) return;

      const userAgent = navigator.userAgent || navigator.vendor;
      const isInAppBrowser =
        /Twitter|TwitterAndroid|FBAN|FBAV|Instagram|Line|FB_IAB|KAKAOTALK/i.test(
          userAgent
        );

      if (isInAppBrowser) {
        setShowWarning(true);
      }
    } catch (error) {
      console.error('Failed to check in-app browser:', error);
    }
  }, []);

  const handleDismiss = () => {
    setShowWarning(false);
    try {
      // 今日の日付を保存（翌日には再度表示される）
      localStorage.setItem('inAppBrowserWarningDismissed', new Date().toDateString());
    } catch (error) {
      console.error('Failed to save warning state:', error);
    }
  };

  return { showWarning, handleDismiss };
}
