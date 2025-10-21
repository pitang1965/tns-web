import type { Metadata } from 'next';
import { Suspense } from 'react';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { ItineraryList } from '@/components/itinerary/ItineraryList';
import { H1, LargeText } from '@/components/common/Typography';
import { getItineraries } from '@/lib/itineraries';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: '保存された旅程一覧 | 車旅のしおり',
  description:
    'あなたが作成した旅程の一覧です。過去の旅行計画を確認したり、新しい旅程を作成したりできます。',
  keywords: '旅程,旅行計画,車旅,車中泊,車中泊スポット,道の駅,RVパーク',
  openGraph: {
    title: '車旅のしおり',
    description:
      '旅程を簡単に作成。車中泊場所の情報も提供し、旅行の計画から実行まで、あなたの旅をサポートします。',
    images: [
      {
        url: 'https://tabi.over40web.club/touge.webp', // 1200×628のOGP用画像
        width: 1200,
        height: 628,
        alt: '車旅のしおりアプリ - 旅行計画作成ツール',
      },
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default withPageAuthRequired(
  async function Itineraries() {
    // Promiseを作成（awaitせずに渡す）
    const itinerariesPromise = getItineraries();

    return (
      <main className='flex flex-col items-center justify-between p-4 sm:p-8 md:p-12 lg:p-24 bg-background text-foreground'>
        <section>
          <H1>保存された旅程一覧</H1>
          <LargeText>
            これまでに作成した旅程を確認できます。新しい旅程を作成する場合は、「新規作成」ボタンをクリックしてください。
          </LargeText>
          <Suspense
            fallback={
              <div className='flex flex-col gap-2'>
                <Button size='sm' className='w-20' disabled>
                  新規作成
                </Button>
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className='border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 animate-pulse'
                    >
                      <div className='h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3'></div>
                      <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2'></div>
                      <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6'></div>
                    </div>
                  ))}
                </div>
              </div>
            }
          >
            <ItineraryList itinerariesPromise={itinerariesPromise} />
          </Suspense>
        </section>
      </main>
    );
  },
  { returnTo: '/itineraries' }
);
