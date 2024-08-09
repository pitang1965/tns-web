import { withPageAuthRequired, WithPageAuthRequired   } from '@auth0/nextjs-auth0';
import ItineraryDetail from '@/components/itinerary/ItineraryDetail';

type PageProps = {
  params: { id: string };
};

function ItinerariesPage({ params }: PageProps) {
  if (!params?.id) {
    return <div>旅程が見つかりません。</div>;
  }

  return <ItineraryDetail id={params.id} />;
}

export default withPageAuthRequired(ItinerariesPage as any, { returnTo: '/itineraries' });
