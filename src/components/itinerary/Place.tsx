import React from 'react';
import { PlaceTypeBadge } from '../PlaceTypeBadge';
import { Address } from './Address';
import { Itinerary } from '@/data/types/itinerary';
type PlaceProps = Itinerary['dayPlans'][number]['activities'][number]['place'];

export const Place: React.FC<PlaceProps> = ({
  name,
  type,
  address,
  location,
}) => (
  <div className='mt-1'>
    <div className='flex items-center gap-2'>
      <PlaceTypeBadge type={type} />
      <span className='font-medium'>{name}</span>
    </div>
    {address && <Address address={address} />}
    {location && (
      <div className='text-xs text-gray-500 dark:text-gray-400'>
        {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
      </div>
    )}
  </div>
);
