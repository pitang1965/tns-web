'use client';

import { Itinerary } from '@/types';
import { useEffect, useState } from 'react';

// TODO: データベースからデータを取るようにする
import { sampleItineraries } from '@/data/itineraries';

interface ItineraryDetailProps {
  id: string;
}

const ItineraryDetail: React.FC<ItineraryDetailProps> = ({ id }) => {
  const [itinerary, setItinerary] = useState<Itinerary | undefined>();

  useEffect(() => {
    const foundItinerary = sampleItineraries.find(
      (itinerary) => itinerary.id === id
    );
    setItinerary(foundItinerary);
  }, [id]);

  if (!itinerary) {
    return <div>旅程が見つかりません。</div>;
  }

  return (
    <div className='flex flex-col items-center justify-between p-24 bg-background text-foreground'>
      <h1 className='text-5xl py-4'>{itinerary.title}</h1>
      <p className='text-lg'>{itinerary.description}</p>
      <p>開始日: {itinerary.startDate}</p>
      <p>終了日: {itinerary.endDate}</p>
    </div>
  );
};

export default ItineraryDetail;
