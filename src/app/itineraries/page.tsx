import type { Metadata } from 'next';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { ItineraryList } from '@/components/itinerary/ItineraryList';
import { H1, LargeText } from '@/components/common/Typography';
import { getItineraries } from '@/lib/itineraries';

export const metadata: Metadata = {
  title: '保存された旅程一覧 | 旅のしおり',
  description:
    'あなたが作成した旅程の一覧です。過去の旅行計画を確認したり、新しい旅程を作成したりできます。',
  keywords: '旅程一覧,旅行計画,旅のしおり,保存済み旅程',
  openGraph: {
    title: '旅のしおり',
    description: '旅のしおりを簡単に作成。旅行の計画から実行まで、あなたの旅をサポートします。文',
    images: [
      {
        url: 'https://tabi.over40web.club/touge.webp', // 1200×628のOGP用画像
        width: 1200,
        height: 628,
        alt: '旅のしおりアプリ - 旅行計画作成ツール',
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
    const itineraries = await getItineraries();

    return (
      <main className='flex flex-col items-center justify-between p-4 sm:p-8 md:p-12 lg:p-24 bg-background text-foreground'>
        <section>
          <H1>保存された旅程一覧</H1>
          <LargeText>
            これまでに作成した旅程を確認できます。新しい旅程を作成する場合は、「新規作成」ボタンをクリックしてください。
          </LargeText>
          <ItineraryList itineraries={itineraries} />
        </section>
      </main>
    );
  },
  { returnTo: '/itineraries' }
);
