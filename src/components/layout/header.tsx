'use client';
import { useUser } from '@auth0/nextjs-auth0/client';
import { LoginButton } from '@/components/auth/login-button';
import { LogoutButton } from '@/components/auth/logout-button';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { UserAvatar } from '@/components/user-avatar';
import { Navigation } from '@/components/layout/navigation';

export function Header() {
  const { user, error, isLoading } = useUser();
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error.message}</div>;

  return (
    <div className='flex items-center justify-between text-foreground bg-white dark:bg-black p-2 gap-2'>
      <p className='text-xl ml-auto'>旅のしおり</p>
      <div className='flex items-center space-x-4 ml-auto'>
        <Navigation />
        {!user && <LoginButton />}
        {user && <LogoutButton />}
        <ModeToggle />
      </div>
      {user && <UserAvatar user={user} />}
    </div>
  );
}
