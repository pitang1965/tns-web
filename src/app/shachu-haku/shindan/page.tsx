import { Metadata } from 'next';
import DiagnosisClient from '@/components/diagnosis/DiagnosisClient';
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: '車中泊はどこで寝る？あなたに合う場所診断 | 車旅のしおり',
  description:
    '車中泊はどこでできる？どこで寝るのがいい？10の質問に答えるだけで、道の駅・SA/PA・RVパーク・オートキャンプ場など、あなたにぴったりの車中泊スポットタイプがわかります。',
  keywords:
    '車中泊 どこで寝る,車中泊 どこでできる,車中泊 どこがいい,車中泊 場所,車中泊スポット診断,車中泊 おすすめ,道の駅 車中泊,SA PA 車中泊,RVパーク,オートキャンプ場',
  openGraph: {
    title: '車中泊はどこで寝る？あなたに合う場所診断 | 車旅のしおり',
    description:
      '車中泊はどこでできる？10の質問に答えて、あなたにぴったりの車中泊スポットを見つけよう。',
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
    title: '車中泊はどこで寝る？あなたに合う場所診断',
    description:
      '車中泊はどこでできる？10の質問に答えて、あなたにぴったりの車中泊スポットを見つけよう。',
  },
};

// FAQ構造化データ - 質問形式の検索に強い
function FaqJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '車中泊はどこで寝るのがいいですか？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '車中泊できる場所は主に5種類あります。道の駅（無料・24時間トイレあり）、SA/PA（高速道路のサービスエリア・パーキングエリア）、RVパーク（有料・電源や水道完備）、オートキャンプ場（有料・設備充実）、無料キャンプ場（予約不要の場所も多い）です。初心者には設備が整った道の駅やRVパークがおすすめです。',
        },
      },
      {
        '@type': 'Question',
        name: '車中泊はどこでできますか？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '全国の道の駅（約1,200箇所）、高速道路のSA/PA、RVパーク（約300箇所）、オートキャンプ場などで車中泊ができます。ただし、道の駅やSA/PAは仮眠目的の利用が推奨されており、長期滞在は控えましょう。本格的な車中泊にはRVパークやオートキャンプ場の利用がおすすめです。',
        },
      },
      {
        '@type': 'Question',
        name: '車中泊初心者におすすめの場所は？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '車中泊初心者には「RVパーク」がおすすめです。電源・水道が使え、24時間トイレもあり、車中泊が公認されているので安心して泊まれます。次におすすめなのは「道の駅」で、無料で利用でき、トイレや自販機も完備されています。',
        },
      },
      {
        '@type': 'Question',
        name: '道の駅で車中泊してもいいですか？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '道の駅での車中泊は、仮眠や休憩目的であれば基本的に許容されています。ただし、キャンプ行為（椅子やテーブルを出す、調理する等）は禁止されている場所がほとんどです。マナーを守り、長期滞在は避けましょう。一部の道の駅では車中泊を禁止している場所もあるので、事前に確認することをおすすめします。',
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default function ShindanPage() {
  return (
    <>
      <FaqJsonLd />
      <BreadcrumbJsonLd
        items={[
          { name: 'ホーム', url: 'https://tabi.over40web.club' },
          {
            name: '車中泊マップ',
            url: 'https://tabi.over40web.club/shachu-haku',
          },
          {
            name: '車中泊スポット診断',
            url: 'https://tabi.over40web.club/shachu-haku/shindan',
          },
        ]}
      />
      <DiagnosisClient />
    </>
  );
}
