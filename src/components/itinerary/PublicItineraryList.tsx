'use client';

import { use } from 'react';
import { ClientItineraryDocument } from '@/data/schemas/itinerarySchema';
import { PublicItineraryItem } from '@/components/itinerary/PublicItineraryItem';
import { LargeText } from '@/components/common/Typography';

type Props = {
  itinerariesPromise: Promise<ClientItineraryDocument[]>;
  limit?: number; // 表示する最大数を指定するためのオプションプロパティ
};

export const PublicItineraryList: React.FC<Props> = ({
  itinerariesPromise,
  limit = 5,
}) => {
  const itineraries = use(itinerariesPromise);

  if (itineraries.length > 0 && itineraries[0].owner) {
    console.log('Owner data:', itineraries[0].owner);
  }
  // 指定された上限数までアイテムを制限
  const limitedItineraries = itineraries.slice(0, limit);

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
      {limitedItineraries.length > 0 ? (
        limitedItineraries.map((itinerary) => (
          <PublicItineraryItem key={itinerary.id} itinerary={itinerary} />
        ))
      ) : (
        <div className='col-span-full text-center py-8'>
          <LargeText className='text-gray-600'>
            現在公開されている旅程がありません。
          </LargeText>
          <p className='text-sm text-gray-500 mt-2'>
            データの読み込みに問題がある場合は、しばらくしてから再度お試しください。
          </p>
        </div>
      )}
    </div>
  );
};
