'use client';
import Image from 'next/image';
import { useUser } from '@auth0/nextjs-auth0/client';

export default function Home() {
  const { user, error, isLoading } = useUser();
  return (
    <div className='flex flex-row items-center justify-between p-24 bg-background text-foreground'>
      <div className='w-1/2 flex justify-center'>
        <Image
          className='relative dark:drop-shadow-[0_0_0.3rem_#ffffff70]'
          src='/over40.svg'
          alt='Over 40 Web Club Logo'
          width={180}
          height={37}
          priority
        />
      </div>
      <div className='w-1/2 flex flex-col items-center'>
        <p className='text-5xl py-4'>旅のしおり</p>
        {!user && <p className='text-lg'>右上からログインしてください。</p>}
        {user && <p className='text-lg'>こんにちは。{user.name}さん</p>}
      </div>
    </div>
  );
}
