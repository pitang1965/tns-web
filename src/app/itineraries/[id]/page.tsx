import type { Metadata } from 'next';
import ItineraryDetail from '@/components/itinerary/ItineraryDetail';
import { getItineraryById } from '@/lib/itineraries';
import { formatDateWithWeekday } from '@/lib/date';

type PageProps = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export const generateMetadata = async ({
  params,
  searchParams,
}: PageProps): Promise<Metadata> => {
  const itinerary = await getItineraryById(params.id);

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

  // dayパラメータがある場合は日数を表示（ただし旅程が1日の場合は表示しない）
  const dayParam = searchParams.day
    ? parseInt(searchParams.day as string)
    : null;
  const totalDays = itinerary.dayPlans?.length || 1;
  const dayDisplay = dayParam && totalDays > 1 ? ` ${dayParam}日目` : '';

  // 旅程のタイトルと説明を使用
  const title = `${itinerary.title}${dayDisplay} | 車旅のしおり`;
  const description =
    itinerary.description || '車旅のしおりで作成された旅行計画です。';

  // URLを構築（searchParamsがある場合はそれも含める）
  const baseUrl = `https://tabi.over40web.club/itineraries/${params.id}`;
  const url = searchParams.day ? `${baseUrl}?day=${searchParams.day}` : baseUrl;

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
    // other: {
    //   'fb:app_id': '1234567890',
    // },
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
