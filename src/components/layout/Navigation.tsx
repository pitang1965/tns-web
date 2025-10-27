'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { ReactNode } from 'react';
import {
  Info,
  Search,
  BookHeart,
  CircleUser,
  MapPin,
  Plus,
  Mail,
  ChevronDown,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { isAdmin } from '@/lib/userUtils';

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
  const userIsAdmin = isAdmin(user);

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
      {userIsAdmin ? (
        <DropdownMenu>
          <DropdownMenuTrigger className='flex items-center hover:underline hover:decoration-1 hover:underline-offset-4 hover:decoration-current outline-none'>
            <MapPin className='mr-1' />
            車中泊スポット
            <ChevronDown className='ml-1 h-3 w-3' />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem asChild>
              <Link href='/shachu-haku' className='flex items-center w-full'>
                <MapPin className='mr-1 h-4 w-4' />
                一般用
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href='/admin/shachu-haku'
                className='flex items-center w-full'
              >
                <MapPin className='mr-1 h-4 w-4' />
                管理者用
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <NavLink href='/shachu-haku'>
          <MapPin className='mr-1' />
          車中泊スポット
        </NavLink>
      )}
      <NavLink href='/contact'>
        <Mail className='mr-1' />
        お問い合わせ
      </NavLink>
      {user && (
        <NavLink href='/account'>
          <CircleUser className='mr-1' />
          アカウント
        </NavLink>
      )}
    </div>
  );
}
