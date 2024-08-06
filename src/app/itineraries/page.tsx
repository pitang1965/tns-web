import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { ItineraryList } from '@/components/itinerary/ItineraryList';
import { sampleItineraries } from '@/data/itineraries';

export default withPageAuthRequired(
  async function Itineraries() {
    return (
      <div className='flex flex-col items-center justify-between p-24 bg-background text-foreground'>
        <div>
          <p className='text-5xl py-4'></p>
          <p className='text-lg'>保存された旅程一覧</p>
          <ItineraryList itineraries={sampleItineraries} />
        </div>
      </div>
    );
  },
  { returnTo: '/itineraries' }
);
