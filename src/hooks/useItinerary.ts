import { useState, useEffect } from 'react';
import { Itinerary } from '@/data/types/itinerary';
import { sampleItineraries } from '@/data/sampleData/sampleItineraries';

export const useItinerary = (id: string) => {
  const [itinerary, setItinerary] = useState<Itinerary | undefined>();

  useEffect(() => {
    const foundItinerary = sampleItineraries.find(
      (itinerary) => itinerary.id === id
    );
    setItinerary(foundItinerary);
  }, [id]);

  return itinerary;
};
