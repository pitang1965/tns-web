'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { ReactNode } from 'react';
import { Info, BookHeart, MapPin } from 'lucide-react';
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
  const { isLoading } = useUser();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <nav className='fixed bottom-0 left-0 right-0 bg-background text-foreground shadow-top z-50'>
      <div className='flex justify-around py-2'>
        <TabLink href='/' icon={<Info />} label='情報' />
        <TabLink href='/itineraries' icon={<BookHeart />} label='旅程' />
        <TabLink href='/shachu-haku' icon={<MapPin />} label='車中泊' />
      </div>
    </nav>
  );
}
