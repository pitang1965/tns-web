import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { ItineraryList } from '@/components/itinerary/ItineraryList';
import { Itinerary } from '@/types';

export default withPageAuthRequired(
  async function Itineraries() {
    const sampleItineraries: Itinerary[] = [
      {
        id: '1',
        title: '西日本大旅行',
        startDate: '2025-03-12',
        endDate: '2025-04-05',
        description: '近畿、中国、四国、九州を巡る旅',
      },
      {
        id: '2',
        title: '水郷佐原と銚子',
        startDate: '2024-05-18',
        endDate: '2024-05-19',
        description: '市営愛宕山 無料駐車場で車中泊',
      },
    ];

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
