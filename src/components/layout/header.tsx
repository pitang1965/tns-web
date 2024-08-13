'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';
import { LoginButton } from '@/components/auth/login-button';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { UserAvatar } from '@/components/user-avatar';
import { Navigation } from '@/components/layout/navigation';
import { BurgerMenu } from '@/components/layout/burger-menu';

export function Header() {
  const { user, error, isLoading } = useUser();
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error.message}</div>;

  return (
    <div className='flex items-center justify-between text-foreground bg-white dark:bg-black p-2 gap-2'>
      <div className='md:hidden'>
        <BurgerMenu />
      </div>
      <Link href="/" className="text-xl ml-auto cursor-pointer">旅のしおり</Link>
      <div className='flex items-center space-x-4 ml-auto'>
        <div className='hidden md:block'>
          <Navigation />
        </div>
        {!user && <LoginButton />}
        <ModeToggle />
      </div>
      {user && <UserAvatar user={user} />}
    </div>
  );
}
