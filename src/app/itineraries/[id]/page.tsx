import type { Metadata } from 'next';
import ItineraryDetail from '@/components/itinerary/ItineraryDetail';
import { getItineraryById } from '@/lib/itineraries';
import { formatDateWithWeekday } from '@/lib/date';

type PageProps = {
  params: Promise<{ id: string }>;
};

export const generateMetadata = async ({
  params,
}: PageProps): Promise<Metadata> => {
  const { id } = await params;
  const itinerary = await getItineraryById(id);

  if (!itinerary) {
    return {
      title: '旅程が見つかりません | 車旅のしおり',
      description: '指定された旅程の情報が見つかりませんでした。',
      openGraph: {
        title: '旅程が見つかりません | 車旅のしおり',
        description: '指定された旅程の情報が見つかりませんでした。',
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
  }

  const title = `${itinerary.title} | 車旅のしおり`;
  const description =
    itinerary.description || '車旅のしおりで作成された旅行計画です。';
  const url = `https://tabi.over40web.club/itineraries/${id}`;

  return {
    title: title,
    description: description,
    keywords: '旅程詳細,旅行計画,車旅,車中泊,ドライブ旅行,' + itinerary.title,
    openGraph: {
      title: title,
      description: description,
      url: url,
      images: [
        {
          url: 'https://tabi.over40web.club/touge.webp',
          width: 1200,
          height: 628,
          alt: `${itinerary.title} - 車旅のしおり`,
        },
      ],
      locale: 'ja_JP',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
    },
    alternates: {
      canonical: `/itineraries/${id}`,
    },
  };
};

export default async function ItinerariesPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    return <div>旅程が見つかりませんね。</div>;
  }

  return <ItineraryDetail id={id} />;
}
