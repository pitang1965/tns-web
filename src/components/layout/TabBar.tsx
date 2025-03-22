'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { ReactNode } from 'react';
import { Info, Search, BookHeart, CircleUser } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/loading-spinner';

const activeClassNames = 'text-blue-500 dark:text-blue-400';
const inactiveClassNames = 'text-gray-600 dark:text-gray-400';

type TabLinkProps = {
  href: string;
  icon: ReactNode;
  label: string;
};

const TabLink = ({ href, icon, label }: TabLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`flex flex-col items-center space-y-1 ${
        isActive ? activeClassNames : inactiveClassNames
      }`}
    >
      {icon}
      <span className='text-xs'>{label}</span>
    </Link>
  );
};

export function TabBar() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <nav className='fixed bottom-0 left-0 right-0 bg-background text-foreground shadow-top'>
      <div className='flex justify-around py-2'>
        <TabLink href='/' icon={<Info />} label='情報' />
        <TabLink href='/search' icon={<Search />} label='検索' />
        <TabLink href='/itineraries' icon={<BookHeart />} label='旅程一覧' />
        {user && (
          <TabLink href='/account' icon={<CircleUser />} label='アカウント' />
        )}
      </div>
    </nav>
  );
}
