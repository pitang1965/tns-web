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
    if (cachedIsAdmin !== null) {
      setIsAdmin(cachedIsAdmin);
      setIsLoading(false);
      return;
    }
    fetchIsAdmin().then((status) => {
      setIsAdmin(status);
      setIsLoading(false);
    });
  }, []);

  return { isAdmin, isLoading };
}
