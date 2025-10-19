'use client';

import { use } from 'react';

export type Environment = 'development' | 'production' | 'unknown';

interface EnvironmentResponse {
  environment: Environment;
}

// 環境情報を取得するPromiseをキャッシュ
let environmentPromise: Promise<EnvironmentResponse> | null = null;

function getEnvironment(): Promise<EnvironmentResponse> {
  if (!environmentPromise) {
    // クライアントサイドでのみ実行されることを保証
    if (typeof window !== 'undefined') {
      environmentPromise = fetch('/api/environment')
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to fetch environment: ${res.status}`);
          }
          return res.json();
        })
        .catch((error) => {
          console.error('Error fetching environment:', error);
          // エラー時は unknown を返す
          return { environment: 'unknown' as Environment };
        });
    } else {
      // サーバーサイドでは unknown を返す（クライアントで再度取得される）
      environmentPromise = Promise.resolve({ environment: 'unknown' as Environment });
    }
  }
  return environmentPromise;
}

export function useEnvironment() {
  const data = use(getEnvironment());
  return data.environment;
}
