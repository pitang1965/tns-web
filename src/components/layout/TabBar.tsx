'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { ReactNode } from 'react';
import { Info, Search, BookHeart, CircleUser, MapPin, Users } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { isAdmin } from '@/lib/userUtils';

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
  const pathname = usePathname();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Check if user is admin
  const userIsAdmin = isAdmin(user);

  // For admin users, determine which admin tab to show based on current path
  const getAdminTab = () => {
    if (pathname === '/admin/submissions') {
      // If on submissions page, show link to spot management
      return <TabLink href='/admin/shachu-haku' icon={<MapPin />} label='スポット管理' />;
    } else {
      // Default to submissions management
      return <TabLink href='/admin/submissions' icon={<Users />} label='投稿管理' />;
    }
  };

  return (
    <nav className='fixed bottom-0 left-0 right-0 bg-background text-foreground shadow-top z-50'>
      <div className='flex justify-around py-2'>
        <TabLink href='/' icon={<Info />} label='情報' />
        <TabLink href='/search' icon={<Search />} label='検索' />
        <TabLink href='/itineraries' icon={<BookHeart />} label='旅程一覧' />
        {userIsAdmin ? (
          getAdminTab()
        ) : (
          <TabLink href='/shachu-haku' icon={<MapPin />} label='車中泊' />
        )}
        {user && (
          <TabLink href='/account' icon={<CircleUser />} label='アカウント' />
        )}
      </div>
    </nav>
  );
}
