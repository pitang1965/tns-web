'use client';

import React from 'react';
import { Itinerary } from '@/types';
import { ItineraryCard } from './ItineraryCard';

interface Props {
  itineraries: Itinerary[];
}

export const ItineraryList: React.FC<Props> = ({ itineraries }) => {
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
      {itineraries.map((itinerary) => (
        <ItineraryCard key={itinerary.id} itinerary={itinerary} />
      ))}
    </div>
  );
};
