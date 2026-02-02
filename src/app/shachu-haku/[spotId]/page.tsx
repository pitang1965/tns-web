import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCampingSpotById } from '../../actions/campingSpots/admin';
import { CampingSpotTypeLabels } from '@/data/schemas/campingSpot';
import SpotDetailClient from './SpotDetailClient';
import {
  CampingSpotJsonLd,
  BreadcrumbJsonLd,
} from '@/components/seo/JsonLd';

type PageProps = {
  params: Promise<{ spotId: string }>;
};

export const generateMetadata = async ({
  params,
}: PageProps): Promise<Metadata> => {
  try {
    const { spotId } = await params;
    const spot = await getCampingSpotById(spotId);

    if (!spot) {
      return {
        title: '車中泊スポットが見つかりません | 車旅のしおり',
        description: '指定された車中泊スポットの情報が見つかりませんでした。',
        openGraph: {
          title: '車中泊スポットが見つかりません | 車旅のしおり',
          description: '指定された車中泊スポットの情報が見つかりませんでした。',
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
        },
      };
    }

    const title = `${spot.name} | 車中泊スポット - 車旅のしおり`;
    const typeLabel =
      CampingSpotTypeLabels[spot.type as keyof typeof CampingSpotTypeLabels];
    const priceInfo = spot.pricing.isFree
      ? '無料'
      : spot.pricing.pricePerNight
      ? `¥${spot.pricing.pricePerNight}`
      : '料金要確認';
    const description = `${spot.prefecture}の${typeLabel}「${spot.name}」の車中泊スポット情報。${priceInfo}。${spot.address}`;
    const url = `https://tabi.over40web.club/shachu-haku/${spotId}`;

    return {
      title: title,
      description: description,
      keywords: `車中泊スポット,${spot.prefecture},${typeLabel},${spot.name},車中泊,車旅`,
      openGraph: {
        title: title,
        description: description,
        url: url,
        images: [
          {
            url: 'https://tabi.over40web.club/shachu-haku.webp',
            width: 1200,
            height: 629,
            alt: `${spot.name} - 車中泊スポット`,
          },
        ],
        locale: 'ja_JP',
        type: 'website',
      },
      twitter: {
        card: 'summary',
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: '車中泊スポット | 車旅のしおり',
      description: '車中泊スポットの詳細情報をご覧いただけます。',
      openGraph: {
        title: '車中泊スポット | 車旅のしおり',
        description: '車中泊スポットの詳細情報をご覧いただけます。',
        images: [
          {
            url: 'https://tabi.over40web.club/shachu-haku.webp',
            width: 1200,
            height: 629,
            alt: '夜の車中泊スポット - 車旅のしおり',
          },
        ],
        locale: 'ja_JP',
        type: 'website',
      },
      twitter: {
        card: 'summary',
      },
    };
  }
};

type SpotDetailPageProps = {
  params: Promise<{ spotId: string }>;
};

export default async function SpotDetailPage({ params }: SpotDetailPageProps) {
  const { spotId } = await params;

  if (!spotId) {
    console.error('SpotDetailPage: No spotId provided in params');
    notFound();
  }

  try {
    const spot = await getCampingSpotById(spotId);

    if (!spot) {
      console.error('SpotDetailPage: Spot not found for ID:', spotId);
      notFound();
    }

    const typeLabel =
      CampingSpotTypeLabels[spot.type as keyof typeof CampingSpotTypeLabels] ||
      spot.type;

    return (
      <>
        <CampingSpotJsonLd
          name={spot.name}
          description={`${spot.prefecture}の${typeLabel}「${spot.name}」。${spot.address}`}
          address={spot.address}
          prefecture={spot.prefecture}
          latitude={spot.coordinates[1]}
          longitude={spot.coordinates[0]}
          spotType={typeLabel}
          isFree={spot.pricing.isFree}
          pricePerNight={spot.pricing.pricePerNight}
          url={`https://tabi.over40web.club/shachu-haku/${spotId}`}
        />
        <BreadcrumbJsonLd
          items={[
            { name: 'ホーム', url: 'https://tabi.over40web.club' },
            {
              name: '車中泊マップ',
              url: 'https://tabi.over40web.club/shachu-haku',
            },
            {
              name: spot.name,
              url: `https://tabi.over40web.club/shachu-haku/${spotId}`,
            },
          ]}
        />
        <SpotDetailClient spot={spot} />
      </>
    );
  } catch (error) {
    // Enhanced error logging for debugging Facebook WebView issues
    console.error('SpotDetailPage: Error loading spot:', {
      spotId: spotId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userAgent:
        typeof navigator !== 'undefined' ? navigator.userAgent : 'Server-side',
      timestamp: new Date().toISOString(),
    });

    // For Facebook WebView and other In-App browsers, provide more specific error handling
    if (
      typeof navigator !== 'undefined' &&
      /FBAN|FBAV|Instagram|Line|Twitter/.test(navigator.userAgent)
    ) {
      console.warn(
        'SpotDetailPage: Error occurred in In-App Browser environment'
      );
    }

    notFound();
  }
}
