import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCampingSpotById } from '../../actions/campingSpots';
import { CampingSpotTypeLabels } from '@/data/schemas/campingSpot';
import SpotDetailClient from './SpotDetailClient';

type PageProps = {
  params: { spotId: string };
};

export const generateMetadata = async ({
  params,
}: PageProps): Promise<Metadata> => {
  try {
    const spot = await getCampingSpotById(params.spotId);

    if (!spot) {
      return {
        title: '車中泊スポットが見つかりません | 旅のしおり',
        description: '指定された車中泊スポットの情報が見つかりませんでした。',
        openGraph: {
          title: '車中泊スポットが見つかりません | 旅のしおり',
          description: '指定された車中泊スポットの情報が見つかりませんでした。',
          images: [
            {
              url: 'https://tabi.over40web.club/touge.webp',
              width: 1200,
              height: 628,
              alt: '旅のしおり - 車中泊スポット検索',
            },
          ],
          locale: 'ja_JP',
          type: 'website',
        },
        twitter: {
          card: 'summary_large_image',
        },
      };
    }

    const title = `${spot.name} | 車中泊スポット - 旅のしおり`;
    const typeLabel = CampingSpotTypeLabels[spot.type as keyof typeof CampingSpotTypeLabels];
    const priceInfo = spot.pricing.isFree
      ? '無料'
      : spot.pricing.pricePerNight
      ? `¥${spot.pricing.pricePerNight}`
      : '料金未設定';
    const description = `${spot.prefecture}の${typeLabel}「${spot.name}」の車中泊スポット情報。${priceInfo}。${spot.address}`;
    const url = `https://tabi.over40web.club/shachu-haku/${params.spotId}`;

    return {
      title: title,
      description: description,
      keywords: `車中泊,${spot.prefecture},${typeLabel},${spot.name},旅のしおり`,
      openGraph: {
        title: title,
        description: description,
        url: url,
        images: [
          {
            url: 'https://tabi.over40web.club/touge.webp',
            width: 1200,
            height: 628,
            alt: `${spot.name} - 車中泊スポット`,
          },
        ],
        locale: 'ja_JP',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: '車中泊スポット | 旅のしおり',
      description: '車中泊スポットの詳細情報をご覧いただけます。',
      openGraph: {
        title: '車中泊スポット | 旅のしおり',
        description: '車中泊スポットの詳細情報をご覧いただけます。',
        images: [
          {
            url: 'https://tabi.over40web.club/touge.webp',
            width: 1200,
            height: 628,
            alt: '旅のしおり - 車中泊スポット検索',
          },
        ],
        locale: 'ja_JP',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
      },
    };
  }
};

interface SpotDetailPageProps {
  params: { spotId: string };
}

export default async function SpotDetailPage({ params }: SpotDetailPageProps) {
  if (!params?.spotId) {
    notFound();
  }

  try {
    const spot = await getCampingSpotById(params.spotId);

    if (!spot) {
      notFound();
    }

    return <SpotDetailClient spot={spot} />;
  } catch (error) {
    console.error('Error loading spot:', error);
    notFound();
  }
}
