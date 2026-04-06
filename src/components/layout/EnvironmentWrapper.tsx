'use client';

import { Suspense, useEffect } from 'react';
import { useEnvironment } from '@/hooks/useEnvironment';
import { useIsClient } from '@/hooks/useIsClient';

function EnvironmentClass({ children }: { children: React.ReactNode }) {
  const environment = useEnvironment();
  const isClient = useIsClient();

  // 開発環境では以前の本番ビルドで登録された Service Worker を登録解除する
  // SW が古いキャッシュ（APIレスポンス等）を提供することでマップ表示に問題が生じるため
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => reg.unregister());
      });
    }
  }, []);

  if (!isClient) {
    return <>{children}</>;
  }

  return (
    <div className={environment === 'development' ? 'dev-mode' : ''} style={{ width: '100%' }}>
      {children}
    </div>
  );
}

export function EnvironmentWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<>{children}</>}>
      <EnvironmentClass>{children}</EnvironmentClass>
    </Suspense>
  );
}
