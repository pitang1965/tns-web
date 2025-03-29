import type { Metadata } from 'next';
import ItineraryDetail from '@/components/itinerary/ItineraryDetail';
import { getItineraryById } from '@/lib/itineraries';

type PageProps = {
  params: { id: string };
};

export const generateMetadata = async ({
  params,
}: PageProps): Promise<Metadata> => {
  const itinerary = await getItineraryById(params.id);

  if (!itinerary) {
    return {
      title: '旅程が見つかりません | 旅のしおり',
      description: '指定された旅程の情報が見つかりませんでした。',
      openGraph: {
        title: '旅程が見つかりません | 旅のしおり',
        description: '指定された旅程の情報が見つかりませんでした。',
        images: [
          {
            url: 'https://tabi.over40web.club/touge.webp',
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
  }

  // 旅程のタイトルと説明を使用
  const title = `${itinerary.title} | 旅のしおり`;
  const description =
    itinerary.description || '旅のしおりで作成された旅行計画です。';

  return {
    title: title,
    description: description,
    keywords: '旅程詳細,旅行計画,旅のしおり,' + itinerary.title,
    openGraph: {
      title: title,
      description: description,
      images: [
        {
          url: 'https://tabi.over40web.club/touge.webp',
          width: 1200,
          height: 628,
          alt: `${itinerary.title} - 旅のしおり`,
        },
      ],
      locale: 'ja_JP',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
    },
  };
};

export default function ItinerariesPage({ params }: PageProps) {
  if (!params?.id) {
    return <div>旅程が見つかりませんね。</div>;
  }

  return <ItineraryDetail id={params.id} />;
}
