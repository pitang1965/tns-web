import React from 'react';
import { ClientItineraryDocument } from '@/data/schemas/itinerarySchema';
import { PublicItineraryItem } from '@/components/itinerary/PublicItineraryItem';
import { LargeText } from '@/components/common/Typography';

type Props = {
  itineraries: ClientItineraryDocument[];
  limit?: number; // 表示する最大数を指定するためのオプションプロパティ
};

export const PublicItineraryList: React.FC<Props> = ({
  itineraries,
  limit = 5,
}) => {
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
        <LargeText>公開されている旅程はまだありません。</LargeText>
      )}
    </div>
  );
};
