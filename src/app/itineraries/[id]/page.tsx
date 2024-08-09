import type { Metadata } from 'next';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import ItineraryDetail from '@/components/itinerary/ItineraryDetail';

// TODO: データベースからデータを取るようにする
import { sampleItineraries } from '@/data/itineraries';

type PageProps = {
  params: { id: string };
};

export const generateMetadata = async ({
  params,
}: PageProps): Promise<Metadata> => {
  const itinerary = sampleItineraries.find((i) => i.id === params.id);
  const itineraryTitle = `旅程 ${params.id}`;

  if (!itinerary) {
    return {
      title: '旅程が見つかりません | あなたの旅行計画',
      description: '指定された旅程の情報が見つかりませんでした。',
    };
  }

  return {
    title: `${itinerary.title} | あなたの旅行計画`,
    description: itinerary.description,
    keywords: '旅程詳細,旅行計画,旅のしおり,' + itinerary.title,
  };
};

function ItinerariesPage({ params }: PageProps) {
  if (!params?.id) {
    return <div>旅程が見つかりません。</div>;
  }

  return <ItineraryDetail id={params.id} />;
}

export default withPageAuthRequired(ItinerariesPage as any, {
  returnTo: '/itineraries',
});
