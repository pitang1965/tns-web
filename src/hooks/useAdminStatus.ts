'use client';

import { useState, useEffect } from 'react';

type AdminStatusResult = {
  isAdmin: boolean;
  isLoading: boolean;
};

// モジュールレベルのキャッシュ。同一ページセッション内で複数のコンポーネントが
// useAdminStatus() を呼んでも /api/auth/me へのリクエストは1回のみ
let cachedIsAdmin: boolean | null = null;
let fetchPromise: Promise<boolean> | null = null;

function fetchIsAdmin(): Promise<boolean> {
  if (cachedIsAdmin !== null) return Promise.resolve(cachedIsAdmin);
  if (!fetchPromise) {
    fetchPromise = fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : { isAdmin: false }))
      .then((data: { isAdmin?: boolean }) => {
        cachedIsAdmin = data.isAdmin ?? false;
        return cachedIsAdmin!;
      })
      .catch(() => {
        cachedIsAdmin = false;
        return false;
      });
  }
  return fetchPromise;
}

export function useAdminStatus(): AdminStatusResult {
  const [isAdmin, setIsAdmin] = useState<boolean>(cachedIsAdmin ?? false);
  const [isLoading, setIsLoading] = useState<boolean>(cachedIsAdmin === null);

  useEffect(() => {
    // キャッシュ済みなら state は遅延初期化で既に正しい値になっているため、
    // ここでは非同期の取得結果のみ反映する（同期的な setState は行わない）。
    // fetchIsAdmin() はキャッシュ済みの場合も解決済み Promise を返すので、
    // .then のマイクロタスクでレース（初期化後〜effect実行の間にキャッシュ確定）も補正される。
    let active = true;
    fetchIsAdmin().then((status) => {
      if (!active) return;
      setIsAdmin(status);
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  return { isAdmin, isLoading };
}
