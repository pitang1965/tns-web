'use client';

import { TabBar } from '@/components/layout/tab-bar';

export function Footer() {
  return (
    <footer className='flex items-center justify-center bg-white dark:bg-black p-2'>
      <div className='md:hidden'>
        <TabBar />
      </div>
      <div className='hidden md:block'>
        <a
          className='text-black dark:text-white'
          href='https://over40web.club'
          target='_blank'
          rel='noopener noreferrer'
        >
          Powered by Over 40 Web Club
        </a>
      </div>
    </footer>
  );
}
