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
      <H1>『旅のしおり』について</H1>
      <Image
        className='relative dark:drop-shadow-[0_0_0.3rem_#ffffff70] mb-4'
        src='/azuki.webp'
        alt='あずきちゃん（スズキ エブリイワゴン）'
        width={90}
        height={90}
        priority
      />
      <div>
        <LargeText>旅行計画をもっと簡単に、もっと楽しく。</LargeText>
        <LargeText>
        Google Mapsと連携して旅程を作成・管理できるWebアプリです。目的地の座標をクリップボード経由で簡単に登録し、スムーズな経路探索が可能。日帰りから複数日の旅行まで対応し、作成した旅程は他の人と共有することもできます。
        </LargeText>
        <LargeText>旅のストレスを減らし、思い出に残る体験をサポートします。</LargeText>
        <LargeText>※旅程を編集するにはログインが必要です。</LargeText>
        <LargeText>※現在開発中のサービスです。</LargeText>
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
