import type { Metadata } from 'next';
import ShachuHakuClient from './ShachuHakuClient';
import { CampingSpotTypeLabels } from '@/data/schemas/campingSpot';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const q =
    typeof resolvedSearchParams.q === 'string' &&
    resolvedSearchParams.q.trim() !== ''
      ? resolvedSearchParams.q
      : undefined;
  const type =
    typeof resolvedSearchParams.type === 'string' &&
    resolvedSearchParams.type !== 'all'
      ? resolvedSearchParams.type
      : undefined;

  // Build dynamic title and description
  const titleParts: string[] = [];
  const descriptionParts: string[] = [];

  if (type && type in CampingSpotTypeLabels) {
    const typeLabel =
      CampingSpotTypeLabels[type as keyof typeof CampingSpotTypeLabels];
    titleParts.push(typeLabel);
    descriptionParts.push(typeLabel);
  }

  if (q) {
    titleParts.push(`"${q}"`);
    descriptionParts.push(`「${q}」で検索`);
  }

  const title =
    titleParts.length > 0
      ? `${titleParts.join('・')}の車中泊スポット | 車旅のしおり`
      : '車中泊スポット検索 | 車旅のしおり';

  const description =
    descriptionParts.length > 0
      ? `${descriptionParts.join(
          '・'
        )}の車中泊スポットを検索・閲覧できます。詳細情報、料金、設備、周辺施設などをご確認いただけます。`
      : '全国の車中泊スポットを検索・閲覧できます。道の駅、SA・PA、RVパークなど様々な種類のスポットの詳細情報、料金、設備、周辺施設などをご確認いただけます。';

  // Build URL with current search params for OGP
  const urlParams = new URLSearchParams();
  if (type) urlParams.set('type', type);
  if (q) urlParams.set('q', q);

  const ogUrl = urlParams.toString()
    ? `https://tabi.over40web.club/shachu-haku?${urlParams.toString()}`
    : 'https://tabi.over40web.club/shachu-haku';

  return {
    title,
    description,
    keywords:
      '車中泊,車中泊スポット,スポット検索,道の駅,SA,PA,RVパーク,オートキャンプ場,車旅',
    openGraph: {
      title,
      description,
      url: ogUrl,
      siteName: '車旅のしおり',
      images: [
        {
          url: 'https://tabi.over40web.club/shachu-haku.webp',
          width: 1200,
          height: 629,
          alt: '車中泊スポット - 車旅のしおり',
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
