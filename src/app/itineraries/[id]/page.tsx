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
      title: '旅程が見つかりません | あなたの旅行計画',
      description: '指定された旅程の情報が見つかりませんでした。',
    };
  }

  return {
    title: `${itinerary.title} | あなたの旅行計画`,
    description: itinerary.description ?? undefined,
    keywords: '旅程詳細,旅行計画,旅のしおり,' + itinerary.title,
  };
};

export default function ItinerariesPage({ params }: PageProps) {
  if (!params?.id) {
    return <div>旅程が見つかりませんね。</div>;
  }

  return <ItineraryDetail id={params.id} />;
}
