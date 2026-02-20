'use client';

import { Suspense } from 'react';
import { useEnvironment } from '@/hooks/useEnvironment';
import { useIsClient } from '@/hooks/useIsClient';

function EnvironmentClass({ children }: { children: React.ReactNode }) {
  const environment = useEnvironment();
  const isClient = useIsClient();

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
