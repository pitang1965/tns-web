import React from 'react';
import { PlaceTypeBadge } from '@/components/PlaceTypeBadge';
import { Address } from './Address';
import { Location } from './Location';
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
    {location && <Location location={location} />}
  </div>
);
