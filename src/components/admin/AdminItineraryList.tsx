'use client';

import { use } from 'react';
import { ClientItineraryDocument } from '@/data/schemas/itinerarySchema';
import { AdminItineraryItem } from './AdminItineraryItem';
import { LargeText } from '@/components/common/Typography';

type Props = {
  itinerariesPromise: Promise<ClientItineraryDocument[]>;
};

export const AdminItineraryList: React.FC<Props> = ({
  itinerariesPromise,
}) => {
  const itineraries = use(itinerariesPromise);

  return (
    <div className='flex flex-col gap-2'>
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
        {itineraries.length > 0 ? (
          itineraries.map((itinerary) => (
            <AdminItineraryItem key={itinerary.id} itinerary={itinerary} />
          ))
        ) : (
          <LargeText>旅程はまだありません。</LargeText>
        )}
      </div>
    </div>
  );
};
