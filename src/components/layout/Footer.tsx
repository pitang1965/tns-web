import Link from 'next/link';
import { TabBar } from '@/components/layout/TabBar';

export function Footer() {
  return (
    <footer className='flex flex-col items-center justify-center bg-background text-foreground p-2'>
      <div className='md:hidden'>
        <TabBar />
      </div>

      {/* プライバシーポリシーと利用規約のリンク */}
      <div className='flex flex-wrap gap-4 mb-2 text-sm text-muted-foreground'>
        <Link
          href='/privacy'
          className='hover:text-foreground transition-colors'
        >
          プライバシーポリシー
        </Link>
        <Link href='/terms' className='hover:text-foreground transition-colors'>
          利用規約
        </Link>
      </div>

      <p className='text-xs text-muted-foreground text-center max-w-md'>
        掲載情報は変更されている可能性があります。お出かけ前に現地の看板や公式サイトで最新情報をご確認ください。
      </p>
    </footer>
  );
}
