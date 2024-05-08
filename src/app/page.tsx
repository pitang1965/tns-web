'use client';
import Image from 'next/image';
import { useUser } from '@auth0/nextjs-auth0/client';

export default function Home() {
  const { user } = useUser();

  return (
    <div className='flex flex-col items-center justify-center p-24 bg-background text-foreground'>
      <p className='text-5xl py-4'>情報</p>
      <Image
        className='relative dark:drop-shadow-[0_0_0.3rem_#ffffff70] mb-4'
        src='/over40.svg'
        alt='Over 40 Web Club Logo'
        width={180}
        height={37}
        priority
      />
      {!user && (
        <div>
          <p className='text-lg'>旅行を計画するにはログインしてください。</p>
          <p className='text-xs'>
            続行することにより、本アプリの利用規約及びプライバシー及びCookieに関する声明に同意するものとします。
          </p>
        </div>
      )}
      {user && (
        <div>
          <p className='text-lg'>こんにちは。{user.name}さん</p>
          <p className='text-lg'>旅の情報をチェックしよう。</p>
        </div>
      )}
    </div>
  );
}
