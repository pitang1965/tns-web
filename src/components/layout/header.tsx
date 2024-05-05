'use client';
import { useUser } from '@auth0/nextjs-auth0/client';
import { LoginButton } from '@/components/auth/login-button';
import { LogoutButton } from '@/components/auth/logout-button';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function Header() {
  const { user, error, isLoading } = useUser();
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error.message}</div>;

  return (
    <div className='flex items-center justify-between text-foreground bg-white dark:bg-black p-2 gap-2'>
      <div className='flex-1'></div>
      <p className='absolute left-1/2 transform -translate-x-1/2 font-mono text-sm'>
        Auth0による認証・認可の実験
      </p>
      <div className='flex items-center space-x-4'>
        {!user && <LoginButton />}
        {user && <LogoutButton />}
        <ModeToggle />
      </div>
      {user && (
        <Avatar>
          <AvatarImage src={user.picture || undefined} />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
