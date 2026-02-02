import type { Metadata } from 'next';
import { auth0 } from '@/lib/auth0';
import { getItineraries, getPublicItineraries } from '@/lib/itineraries';
import { ItinerariesClient } from './ItinerariesClient';

export const metadata: Metadata = {
  title: '旅程一覧 | 車旅のしおり',
  description:
    'みんなが共有している旅程を探索したり、自分の旅程を管理できます。理想の旅行先を見つけよう。',
  keywords: '旅程一覧,旅行計画,車旅,車中泊,旅行先検索,ドライブ旅行',
  openGraph: {
    title: '旅程一覧 | 車旅のしおり',
    description:
      'みんなが共有している旅程を探索したり、自分の旅程を管理できます。旅行の計画から実行まで、あなたの旅をサポートします。',
    images: [
      {
        url: 'https://tabi.over40web.club/touge.webp',
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

export default async function Itineraries() {
  const session = await auth0.getSession();

  // データを並列で取得
  const [publicItineraries, myItineraries] = await Promise.all([
    getPublicItineraries(),
    session ? getItineraries() : Promise.resolve(null),
  ]);

  return (
    <ItinerariesClient
      publicItineraries={publicItineraries}
      myItineraries={myItineraries}
      isAuthenticated={!!session}
    />
  );
}
