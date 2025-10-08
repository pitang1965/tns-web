import type { Metadata } from 'next';
import ShachuHakuClient from './ShachuHakuClient';
import { CampingSpotTypeLabels } from '@/data/schemas/campingSpot';

type Props = {
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = typeof searchParams.q === 'string' && searchParams.q.trim() !== '' ? searchParams.q : undefined;
  const prefecture = typeof searchParams.prefecture === 'string' && searchParams.prefecture !== 'all' ? searchParams.prefecture : undefined;
  const type = typeof searchParams.type === 'string' && searchParams.type !== 'all' ? searchParams.type : undefined;

  // Build dynamic title and description
  let titleParts: string[] = [];
  let descriptionParts: string[] = [];

  if (prefecture) {
    titleParts.push(prefecture);
    descriptionParts.push(prefecture);
  }

  if (type && type in CampingSpotTypeLabels) {
    const typeLabel = CampingSpotTypeLabels[type as keyof typeof CampingSpotTypeLabels];
    titleParts.push(typeLabel);
    descriptionParts.push(typeLabel);
  }

  if (q) {
    titleParts.push(`"${q}"`);
    descriptionParts.push(`「${q}」で検索`);
  }

  const title = titleParts.length > 0
    ? `${titleParts.join('・')}の車中泊スポット | 旅のしおり`
    : '車中泊スポット検索 | 旅のしおり';

  const description = descriptionParts.length > 0
    ? `${descriptionParts.join('・')}の車中泊スポットを検索・閲覧できます。詳細情報、料金、設備、周辺施設などをご確認いただけます。`
    : '全国の車中泊スポットを検索・閲覧できます。道の駅、SA・PA、RVパークなど様々な種類のスポットの詳細情報、料金、設備、周辺施設などをご確認いただけます。';

  // Build URL with current search params for OGP
  const urlParams = new URLSearchParams();
  if (prefecture) urlParams.set('prefecture', prefecture);
  if (type) urlParams.set('type', type);
  if (q) urlParams.set('q', q);

  const ogUrl = urlParams.toString()
    ? `https://tabi.over40web.club/shachu-haku?${urlParams.toString()}`
    : 'https://tabi.over40web.club/shachu-haku';

  return {
    title,
    description,
    keywords: '車中泊,スポット検索,道の駅,SA,PA,RVパーク,キャンプ,旅行,旅のしおり',
    openGraph: {
      title,
      description,
      url: ogUrl,
      siteName: '旅のしおり',
      images: [
        {
          url: 'https://tabi.over40web.club/shachu-haku.webp',
          width: 1200,
          height: 629,
          alt: '車中泊スポット - 旅のしおり',
        },
      ],
      locale: 'ja_JP',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default function ShachuHakuPage() {
  return <ShachuHakuClient />;
}
