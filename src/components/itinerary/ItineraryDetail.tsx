'use client';

import { Itinerary } from '@/data/types/itinerary';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  TransportationBadge,
  TransportationType,
} from '@/components/TransportationBadge';

import { DayPlan } from '@/components/itinerary/DayPlan';
import { ItineraryHeader } from '@/components/itinerary/ItineraryHeader';
import { useItinerary } from '@/hooks/useItinerary';

// TODO: データベースからデータを取るようにする
import { sampleItineraries } from '@/data/sampleData/sampleItineraries';

type ItineraryDetailProps = {
  id: string;
}

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
      <ItineraryHeader itinerary={itinerary} />

      <div className='w-full'>
        <h2 className='text-2xl font-semibold mb-4'>旅程詳細</h2>
        {itinerary.dayPlans.length > 0 ? (
          itinerary.dayPlans.map((day, index) => (
            <DayPlan key={index} day={day} />
          ))
        ) : (
          <p className='text-center text-gray-600 dark:text-gray-400'>
            まだ旅程の詳細が登録されていません。「編集」ボタンから旅程を追加してください。
          </p>
        )}
      </div>
    </div>
  );
};

export default ItineraryDetail;
