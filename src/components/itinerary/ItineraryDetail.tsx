'use client';

import { Itinerary } from '@/data/types/itinerary';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

// TODO: データベースからデータを取るようにする
import { sampleItineraries } from '@/data/sampleData/sampleItineraries';

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
    <div className='flex flex-col gap-2 items-center'>
      <div className='flex gap-2'>
        <Button onClick={() => {}}>編集</Button>
        <Button
          onClick={() => {}}
          className='delete-itinerary'
          variant='destructive'
        >
          削除
        </Button>
      </div>
      <div className='flex flex-col items-center justify-between p-24 bg-background text-foreground'>
        <h1 className='text-5xl py-4'>{itinerary.title}</h1>
        <p className='text-lg'>{itinerary.description}</p>
        <p>開始日: {itinerary.startDate}</p>
        <p>終了日: {itinerary.endDate}</p>
      </div>
    </div>
  );
};

export default ItineraryDetail;
