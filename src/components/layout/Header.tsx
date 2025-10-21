'use client';

import { useState, useEffect, Suspense } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';
import { LoginButton } from '@/components/auth/LoginButton';
import { ModeToggle } from '@/components/common/ModeToggle';
import { UserAvatar } from '@/components/common/UserAvatar';
import { Navigation } from '@/components/layout/Navigation';
import { BurgerMenu } from '@/components/layout/BurgerMenu';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { useEnvironment } from '@/hooks/useEnvironment';

function EnvironmentBadge() {
  const environment = useEnvironment();

  // 開発環境のみバッジを表示
  if (environment === 'development') {
    return (
      <span className='px-2 py-1 text-xs font-bold bg-orange-500 text-white rounded-md'>
        DEV
      </span>
    );
  }

  // 本番環境では何も表示しない
  return null;
}

export function Header() {
  const { user, error, isLoading } = useUser();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>{error.message}</div>;

  return (
    <header className='fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-50'>
      <div className='flex items-center justify-between text-foreground bg-background p-2 gap-2'>
        <div className='md:hidden'>
          <BurgerMenu />
        </div>
        <Link href='/' className='text-xl ml-auto cursor-pointer'>
          車旅のしおり
        </Link>
        <Suspense fallback={null}>
          <EnvironmentBadge />
        </Suspense>
        <div className='flex items-center space-x-4 ml-auto'>
          <div className='hidden md:block'>
            <Navigation />
          </div>

          {isClient && !user && <LoginButton />}
          <ModeToggle />
        </div>
        {isClient && user && <UserAvatar user={user} />}
      </div>
    </header>
  );
}
