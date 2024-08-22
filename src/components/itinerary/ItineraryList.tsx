'use client';

import React from 'react';
import { Itinerary } from '@/data/types/itinerary';
import { ItineraryItem } from './ItineraryItem';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

type Props = {
  itineraries: Itinerary[];
};

export const ItineraryList: React.FC<Props> = ({ itineraries }) => {
  const router = useRouter();

  const handleCreateNew = () => {
    router.push('/itineraries/new');
  };

  return (
    <div className='flex flex-col gap-2'>
      <Button onClick={handleCreateNew} className='w-20'>
        新規作成
      </Button>
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
        {itineraries.map((itinerary) => (
          <ItineraryItem key={itinerary.id} itinerary={itinerary} />
        ))}
      </div>
    </div>
  );
};
