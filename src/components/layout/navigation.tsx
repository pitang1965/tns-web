import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navigation() {
  const pathname = usePathname();
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
