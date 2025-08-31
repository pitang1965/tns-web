'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Info, Search, BookHeart, CircleUser, MapPin } from 'lucide-react';
import { useUser } from '@auth0/nextjs-auth0/client';

export function BurgerMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { user } = useUser();

  // Check if user is admin
  const isAdmin = user?.email &&
    process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',')
      .map(email => email.trim())
      .includes(user.email);

  const handleItemClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    e.preventDefault();
    setOpen(false);
    router.push(href);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger>
        <Button variant='outline'>
          <svg
            className='w-5 h-5'
            viewBox='0 0 20 20'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              d='M3 5h14M3 10h14M3 15h14'
              stroke='currentColor'
              strokeWidth='1.5'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Link
            href='/'
            className='flex items-center'
            onClick={(e) => handleItemClick(e, '/')}
          >
            <Info className='mr-1' />
            情報
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Link
            href='/search'
            className='flex items-center'
            onClick={(e) => handleItemClick(e, '/search')}
          >
            <Search className='mr-1' />
            検索
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Link
            href='/itineraries'
            className='flex items-center'
            onClick={(e) => handleItemClick(e, '/itineraries')}
          >
            <BookHeart className='mr-1' />
            旅程
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Link
              href='/admin/shachu-haku'
              className='flex items-center'
              onClick={(e) => handleItemClick(e, '/admin/shachu-haku')}
            >
              <MapPin className='mr-1' />
              車中泊場所
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Link
            href='/account'
            className='flex items-center'
            onClick={(e) => handleItemClick(e, '/account')}
          >
            <CircleUser className='mr-1' />
            アカウント
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
