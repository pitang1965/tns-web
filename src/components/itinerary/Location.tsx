import React from 'react';
import { Itinerary } from '@/data/types/itinerary';

type LocationType =
  Itinerary['dayPlans'][number]['activities'][number]['place']['location'];

type LocationProps = {
  location: LocationType;
};

export const Location: React.FC<LocationProps> = ({ location }) => {
  if (!location) return '位置情報なし';
  return (
    <div className='text-xs text-gray-500 dark:text-gray-400'>
      {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
    </div>
  );
};
