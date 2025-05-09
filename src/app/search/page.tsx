import type { Metadata } from 'next';
import { PublicItineraryList } from '@/components/itinerary/PublicItineraryList';
import { H1, H2, LargeText } from '@/components/common/Typography';
import { getPublicItineraries } from '@/lib/itineraries';

export const metadata: Metadata = {
  title: '旅行先を検索 | 旅のしおり',
  description:
    '理想の旅行先を見つけよう。多様な目的地の中から、あなたにぴったりの行き先を探索できます。',
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

export default async function Search() {
  // 公開旅程を取得
  const publicItineraries = await getPublicItineraries();

  return (
    <div className='container mx-auto p-4 md:p-6'>
      <H1>旅行先を検索</H1>
      <LargeText>みんなが共有している旅程を探索しよう！</LargeText>

      <div className='mb-8'>
        <H2>公開されている旅程</H2>
        <PublicItineraryList itineraries={publicItineraries} />
      </div>
    </div>
  );
}
