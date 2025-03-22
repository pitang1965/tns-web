import React from 'react';
import { PlaceTypeBadge } from '@/components/common/PlaceTypeBadge';
import { AddressView } from './AddressView';
import { LocationView } from './LocationView';
import { ClientItineraryDocument } from '@/data/schemas/itinerarySchema';
type PlaceProps =
  ClientItineraryDocument['dayPlans'][number]['activities'][number]['place'];

export const PlaceView: React.FC<PlaceProps> = ({
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
    {address && <AddressView address={address} />}
    {location && <LocationView location={location} />}
  </div>
);
