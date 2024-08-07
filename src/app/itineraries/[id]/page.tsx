import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import ItineraryDetail from '@/components/itinerary/ItineraryDetail';
import { Params } from 'next/dist/shared/lib/router/utils/route-matcher';

type PageProps = {
  params: Params;
};

const ItinerariesPage: React.FC<PageProps> = ({ params }) => {
  if (!params?.id) {
    return <div>旅程が見つかりません。</div>;
  }

  return <ItineraryDetail id={params.id} />;
};

// TODO: anyをなんとかする
export default withPageAuthRequired(ItinerariesPage as any);
