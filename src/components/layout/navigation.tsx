// components/ui/navigation.tsx
import Link from 'next/link';

export function Navigation() {
  return (
    <div className='flex items-center space-x-4'>
      <Link href='/'>ホーム</Link>
      <Link href='/profile'>プロフィール</Link>
      <Link href='/help'>ヘルプ</Link>
    </div>
  );
}
