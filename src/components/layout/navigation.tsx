import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';

export function Navigation() {
  const { user, isLoading } = useUser();
  const pathname = usePathname();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className='flex items-center space-x-4'>
      <Link
        href='/'
        className={
          pathname === '/'
            ? 'underline decoration-1 underline-offset-4 decoration-current'
            : ''
        }
      >
        ホーム
      </Link>
      {user && (
        <Link
          href='/profile'
          className={
            pathname === '/profile'
              ? 'underline decoration-1 underline-offset-4 decoration-current'
              : ''
          }
        >
          プロフィール
        </Link>
      )}
      <Link
        href='/help'
        className={
          pathname === '/help'
            ? 'underline decoration-1 underline-offset-4 decoration-current'
            : ''
        }
      >
        ヘルプ
      </Link>
    </div>
  );
}
