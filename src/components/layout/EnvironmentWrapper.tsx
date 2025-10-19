'use client';

import { Suspense, useEffect, useState } from 'react';
import { useEnvironment } from '@/hooks/useEnvironment';

function EnvironmentClass({ children }: { children: React.ReactNode }) {
  const environment = useEnvironment();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (environment === 'development') {
      console.log('Development mode detected - applying dev-mode class');
    }
  }, [environment]);

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
