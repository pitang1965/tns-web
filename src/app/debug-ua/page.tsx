'use client';

import { useState } from 'react';

const PATTERNS = [
  { name: 'Twitter', regex: /Twitter/i },
  { name: 'TwitterAndroid', regex: /TwitterAndroid/i },
  { name: 'FBAN', regex: /FBAN/i },
  { name: 'FBAV', regex: /FBAV/i },
  { name: 'Instagram', regex: /Instagram/i },
  { name: 'Line', regex: /Line/i },
  { name: 'FB_IAB', regex: /FB_IAB/i },
];

export default function DebugUserAgentPage() {
  const [userAgent] = useState(() =>
    typeof window !== 'undefined' ? (navigator.userAgent || navigator.vendor) : '',
  );

  const [today] = useState(() =>
    typeof window !== 'undefined' ? new Date().toDateString() : '',
  );

  const [localStorageValue, setLocalStorageValue] = useState(() => {
    if (typeof window === 'undefined') return '';
    try {
      return localStorage.getItem('inAppBrowserWarningDismissed') || 'null';
    } catch {
      return 'Error accessing localStorage';
    }
  });

  const matchedPattern = PATTERNS.filter((p) => p.regex.test(userAgent)).map((p) => p.name);
  const isInAppBrowser = matchedPattern.length > 0;

  const handleClearLocalStorage = () => {
    try {
      localStorage.removeItem('inAppBrowserWarningDismissed');
      setLocalStorageValue('null');
      alert('LocalStorageをクリアしました。ページをリロードしてください。');
    } catch {
      alert('LocalStorageのクリアに失敗しました');
    }
  };

  return (
    <div suppressHydrationWarning className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">User Agent デバッグページ</h1>

      <div className="space-y-6">
        {/* User Agent */}
        <div className="bg-card border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">User Agent</h2>
          <p className="text-sm break-all font-mono bg-muted p-3 rounded">
            {userAgent || '読み込み中...'}
          </p>
        </div>

        {/* 検出結果 */}
        <div className="bg-card border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">アプリ内ブラウザ検出</h2>
          <div className="space-y-2">
            <p>
              <strong>検出結果:</strong>{' '}
              <span
                className={
                  isInAppBrowser
                    ? 'text-yellow-600 font-bold'
                    : 'text-green-600'
                }
              >
                {isInAppBrowser ? 'アプリ内ブラウザ' : '通常のブラウザ'}
              </span>
            </p>
            {matchedPattern.length > 0 && (
              <p>
                <strong>マッチしたパターン:</strong> {matchedPattern.join(', ')}
              </p>
            )}
          </div>
        </div>

        {/* LocalStorage状態 */}
        <div className="bg-card border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">LocalStorage状態</h2>
          <div className="space-y-2 mb-3">
            <p>
              <strong>今日の日付:</strong>{' '}
              <code className="bg-muted px-2 py-1 rounded">{today}</code>
            </p>
            <p>
              <strong>閉じた日付:</strong>{' '}
              <code className="bg-muted px-2 py-1 rounded">
                {localStorageValue}
              </code>
            </p>
            <p>
              <strong>同じ日？:</strong>{' '}
              <span
                className={
                  localStorageValue === today
                    ? 'text-red-600'
                    : 'text-green-600'
                }
              >
                {localStorageValue === today
                  ? 'はい（非表示）'
                  : 'いいえ（表示）'}
              </span>
            </p>
          </div>
          <button
            onClick={handleClearLocalStorage}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            LocalStorageをクリア
          </button>
        </div>

        {/* 表示条件 */}
        <div className="bg-card border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">バナー表示条件</h2>
          <ul className="space-y-1 text-sm">
            <li>
              ✓ アプリ内ブラウザが検出される:{' '}
              <span
                className={isInAppBrowser ? 'text-green-600' : 'text-red-600'}
              >
                {isInAppBrowser ? 'はい' : 'いいえ'}
              </span>
            </li>
            <li>
              ✓ 今日は閉じていない（閉じた日付≠今日）:{' '}
              <span
                className={
                  localStorageValue !== today
                    ? 'text-green-600'
                    : 'text-red-600'
                }
              >
                {localStorageValue !== today ? 'はい' : 'いいえ'}
              </span>
            </li>
            <li className="mt-3 font-bold">
              バナーが表示されるはず:{' '}
              <span
                className={
                  isInAppBrowser && localStorageValue !== today
                    ? 'text-green-600'
                    : 'text-red-600'
                }
              >
                {isInAppBrowser && localStorageValue !== today
                  ? 'はい'
                  : 'いいえ'}
              </span>
            </li>
          </ul>
        </div>

        {/* 使い方 */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">使い方</h2>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>
              XアプリでこのページのURLをポストして、アプリ内ブラウザで開く
            </li>
            <li>User Agentとマッチしたパターンを確認</li>
            <li>
              バナーが表示されない場合は、この情報をスクリーンショットで共有
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
