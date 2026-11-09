'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { ArrowLeft } from 'lucide-react';

// Androidアプリ経由か。Web内遷移でクエリが消えるため sessionStorage に残す
const noopSubscribe = () => () => {};
const getFromApp = () => {
  try {
    return (
      new URLSearchParams(window.location.search).get('utm_source') === 'app' ||
      sessionStorage.getItem('fromApp') === '1'
    );
  } catch {
    return false;
  }
};

export function AppReturnBar() {
  const fromApp = useSyncExternalStore(noopSubscribe, getFromApp, () => false);
  useEffect(() => {
    if (!fromApp) return;
    try {
      sessionStorage.setItem('fromApp', '1');
    } catch {}
  }, [fromApp]);

  if (!fromApp) return null;

  // カスタムスキームは next/link を通さず素の <a> で開く
  return (
    <div className="border-b bg-muted/50 px-4 pt-4 pb-2">
      <a
        href="tabispots://"
        className="inline-flex items-center text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        アプリに戻る
      </a>
    </div>
  );
}
