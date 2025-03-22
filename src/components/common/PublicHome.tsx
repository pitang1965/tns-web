'use client';

import Image from 'next/image';
import dynamic from 'next/dynamic';

const DynamicMap = dynamic(() => import('@/components/common/Map'), {
  ssr: false,
  loading: () => <p>地図の読込中...</p>,
});

export default function ClientHome() {
  return (
    <div className='flex flex-col items-center justify-center p-24 bg-background text-foreground'>
      <h1 className='text-5xl py-4 font-bold'>旅のしおり作成</h1>
      <Image
        className='relative dark:drop-shadow-[0_0_0.3rem_#ffffff70] mb-4'
        src='/over40.svg'
        alt='Over 40 Web Club Logo'
        width={90}
        height={90}
        priority
      />
      <div>
        <p className='text-lg'>旅行を計画するにはログインしてください。</p>
        <p className='text-sm mt-2'>
          旅のしおりを使って、あなたの旅行をより楽しく、効率的に計画しましょう。
        </p>
        <p className='text-xs mt-4'>
          続行することにより、本アプリの利用規約及びプライバシー及びCookieに関する声明に同意するものとします。
        </p>
      </div>
      <div className='w-full h-96 mt-4'>
        <DynamicMap />
      </div>
    </div>
  );
}
