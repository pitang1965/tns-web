'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { ReactNode } from 'react';
import { Info, Search, BookHeart, CircleUser, MapPin } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/loading-spinner';

const activeClassNames =
  'underline decoration-1 underline-offset-4 decoration-current';

type NavLinkProps = {
  href: string;
  children: ReactNode;
};

const NavLink = ({ href, children }: NavLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`flex items-center ${isActive ? activeClassNames : ''}`}
    >
      {children}
    </Link>
  );
};

export function Navigation() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Check if user is admin
  const isAdmin = user?.email && 
    process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',')
      .map(email => email.trim())
      .includes(user.email);

  return (
    <div className='flex items-center space-x-4'>
      <NavLink href='/'>
        <Info className='mr-1' />
        情報
      </NavLink>
      <NavLink href='/search'>
        <Search className='mr-1' />
        検索
      </NavLink>
      <NavLink href='/itineraries'>
        <BookHeart className='mr-1' />
        旅程
      </NavLink>
      {isAdmin && (
        <NavLink href='/admin/shachu-haku'>
          <MapPin className='mr-1' />
          車中泊場所
        </NavLink>
      )}
      {user && (
        <NavLink href='/account'>
          <CircleUser className='mr-1' />
          アカウント
        </NavLink>
      )}
    </div>
  );
}
