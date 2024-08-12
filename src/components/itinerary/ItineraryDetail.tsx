'use client';

import { Itinerary } from '@/data/types/itinerary';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  TransportationBadge,
  TransportationType,
} from '@/components/TransportationBadge';
import { PlaceTypeBadge, PlaceType } from '@/components/PlaceTypeBadge';
import { ActivityTimeDisplay } from '@/components/ActivityTimeDisplay';

// TODO: データベースからデータを取るようにする
import { sampleItineraries } from '@/data/sampleData/sampleItineraries';

interface ItineraryDetailProps {
  id: string;
}

const useItinerary = (id: string) => {
  const [itinerary, setItinerary] = useState<Itinerary | undefined>();

  useEffect(() => {
    const foundItinerary = sampleItineraries.find(
      (itinerary) => itinerary.id === id
    );
    setItinerary(foundItinerary);
  }, [id]);

  return itinerary;
};

const ItineraryDetail: React.FC<ItineraryDetailProps> = ({ id }) => {
  const itinerary = useItinerary(id);

  if (!itinerary) {
    return <div>旅程が見つかりません。</div>;
  }

  return (
    <div className='flex flex-col gap-4 items-center w-full max-w-4xl mx-auto'>
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
      <div className='flex flex-col items-center justify-between p-6 bg-background text-foreground w-full'>
        <h1 className='text-3xl font-bold mb-4'>{itinerary.title}</h1>
        <TransportationBadge
          type={itinerary.transportation.type as TransportationType}
        />
        <p className='text-lg mt-2'>{itinerary.description}</p>
        <p className='mt-2'>
          期間: {itinerary.startDate} ～ {itinerary.endDate}
        </p>
      </div>

      <div className='w-full'>
        <h2 className='text-2xl font-semibold mb-4'>旅程詳細</h2>
        {itinerary.dayPlans.map((day, index) => (
          <div key={index} className='mb-6 bg-gray-100 p-4 rounded-lg'>
            <h3 className='text-xl font-semibold mb-2'>{day.date}</h3>
            {day.activities.length > 0 ? (
              <ul className='space-y-2'>
                {day.activities.map((activity, actIndex) => (
                  <li key={actIndex} className='bg-white p-3 rounded shadow'>
                    <div className='flex'>
                      <p className='font-medium'>{activity.title}</p>
                      <ActivityTimeDisplay
                        startTime={activity.startTime}
                        endTime={activity.endTime}
                      />
                    </div>
                    <div className='flex items-center gap-2 mt-1'>
                      <PlaceTypeBadge type={activity.place.type as PlaceType} />
                      {activity.place.name}
                    </div>
                    {activity.description && (
                      <div className='text-sm mt-1'>{activity.description}</div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>この日の予定はありません。</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ItineraryDetail;
