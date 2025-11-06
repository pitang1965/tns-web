'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ClientItineraryDocument } from '@/data/schemas/itinerarySchema';
import { ItineraryItem } from './ItineraryItem';
import { Button } from '@/components/ui/button';
import { LargeText } from '@/components/common/Typography';

type Props = {
  itinerariesPromise: Promise<ClientItineraryDocument[]>;
};

export const ItineraryList: React.FC<Props> = ({ itinerariesPromise }) => {
  const itineraries = use(itinerariesPromise);
  const router = useRouter();

  const handleCreateNew = () => {
    router.push('/itineraries/new');
  };

  return (
    <div className='flex flex-col gap-2'>
      <Button onClick={handleCreateNew} size='sm' className='w-20 cursor-pointer'>
        新規作成
      </Button>
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
        {itineraries.length > 0 ? (
          itineraries.map((itinerary) => (
            <ItineraryItem key={itinerary.id} itinerary={itinerary} />
          ))
        ) : (
          <LargeText>保存された旅程はまだありません。</LargeText>
        )}
      </div>
    </div>
  );
};
