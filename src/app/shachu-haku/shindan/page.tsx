import { Metadata } from 'next';
import DiagnosisClient from '@/components/diagnosis/DiagnosisClient';

export const metadata: Metadata = {
  title: '車中泊スポット診断 | 車旅のしおり',
  description:
    '10の質問に答えるだけで、あなたにぴったりの車中泊スポットタイプを診断します。道の駅、RVパーク、オートキャンプ場など、最適な場所を見つけましょう。',
  keywords: '車中泊スポット診断,車中泊,道の駅,RVパーク,オートキャンプ場,車旅',
  openGraph: {
    title: '車中泊スポット診断 | 車旅のしおり',
    description:
      '10の質問に答えるだけで、あなたにぴったりの車中泊スポットタイプを診断します。',
    url: 'https://tabi.over40web.club/shachu-haku/shindan',
    images: [
      {
        url: 'https://tabi.over40web.club/shachu-haku.webp',
        width: 1200,
        height: 629,
        alt: '車中泊スポット診断 - 車旅のしおり',
      },
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '車中泊スポット診断 | 車旅のしおり',
    description:
      '10の質問に答えるだけで、あなたにぴったりの車中泊スポットタイプを診断します。',
  },
};

export default function ShindanPage() {
  return <DiagnosisClient />;
}
