'use client';

import { useState, useEffect } from 'react';

type DraftAccessResult = {
  isDraftAllowed: boolean;
  isLoading: boolean;
};

// モジュールレベルのキャッシュ。同一ページセッション内で複数のコンポーネントが
// useDraftAccess() を呼んでも /api/auth/me へのリクエストは1回のみ。
let cachedIsDraftAllowed: boolean | null = null;
let fetchPromise: Promise<boolean> | null = null;

function fetchIsDraftAllowed(): Promise<boolean> {
  if (cachedIsDraftAllowed !== null) return Promise.resolve(cachedIsDraftAllowed);
  if (!fetchPromise) {
    fetchPromise = fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : { isDraftAllowed: false }))
      .then((data: { isDraftAllowed?: boolean }) => {
        cachedIsDraftAllowed = data.isDraftAllowed ?? false;
        return cachedIsDraftAllowed!;
      })
      .catch(() => {
        cachedIsDraftAllowed = false;
        return false;
      });
  }
  return fetchPromise;
}

/**
 * AI旅程ドラフト生成の限定者かどうかをクライアントで判定する。
 * サーバー側の ITINERARY_DRAFT_ALLOWED_EMAILS に基づく /api/auth/me の結果を読む。
 */
export function useDraftAccess(): DraftAccessResult {
  const [isDraftAllowed, setIsDraftAllowed] = useState<boolean>(
    cachedIsDraftAllowed ?? false,
  );
  const [isLoading, setIsLoading] = useState<boolean>(
    cachedIsDraftAllowed === null,
  );

  useEffect(() => {
    let active = true;
    fetchIsDraftAllowed().then((allowed) => {
      if (!active) return;
      setIsDraftAllowed(allowed);
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  return { isDraftAllowed, isLoading };
}
