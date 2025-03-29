'use client';

import Image from 'next/image';
import dynamic from 'next/dynamic';
import { H1, LargeText, SmallText } from '@/components/common/Typography';

const DynamicMap = dynamic(() => import('@/components/common/Map'), {
  ssr: false,
  loading: () => <LargeText>地図の読み込み中...</LargeText>,
});

export default function ClientHome() {
  return (
    <div className='flex flex-col items-center justify-center p-4 sm:p-8 md:p-12 lg:p-24 bg-background text-foreground'>
      <H1>旅のしおり作成</H1>
      <Image
        className='relative dark:drop-shadow-[0_0_0.3rem_#ffffff70] mb-4'
        src='/azuki.webp'
        alt='あずきちゃん（スズキ エブリイワゴン）'
        width={90}
        height={90}
        priority
      />
      <div>
        <LargeText>旅行を計画するにはログインしてください。</LargeText>
        <LargeText>
          旅のしおりを使って、あなたの旅行をより楽しく、効率的に計画しましょう。
        </LargeText>
        <SmallText>
          続行することにより、本アプリの利用規約及びプライバシー及びCookieに関する声明に同意するものとします。
        </SmallText>
      </div>
      <div className='w-full h-96 mt-4'>
        <DynamicMap />
      </div>
    </div>
  );
}
