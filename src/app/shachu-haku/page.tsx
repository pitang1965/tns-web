import type { Metadata } from 'next';
import ShachuHakuClient from './ShachuHakuClient';

export const metadata: Metadata = {
  title: '車中泊スポット検索 | 旅のしおり',
  description:
    '全国の車中泊スポットを検索・閲覧できます。道の駅、SA・PA、RVパークなど様々な種類のスポットの詳細情報、料金、設備、周辺施設などをご確認いただけます。',
  keywords: '車中泊,スポット検索,道の駅,SA,PA,RVパーク,キャンプ,旅行,旅のしおり',
  openGraph: {
    title: '車中泊スポット検索 | 旅のしおり',
    description:
      '全国の車中泊スポットを検索・閲覧できます。道の駅、SA・PA、RVパークなど様々な種類のスポットの詳細情報、料金、設備、周辺施設などをご確認いただけます。',
    url: 'https://tabi.over40web.club/shachu-haku',
    images: [
      {
        url: 'https://tabi.over40web.club/touge.webp',
        width: 1200,
        height: 628,
        alt: '車中泊スポット検索 - 旅のしおり',
      },
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function ShachuHakuPage() {
  return <ShachuHakuClient />;
}
