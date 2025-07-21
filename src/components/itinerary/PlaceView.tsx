import React from 'react';
import { PlaceTypeBadge } from '@/components/itinerary/PlaceTypeBadge';
import { AddressView } from './AddressView';
import { LocationView } from './LocationView';
import { PlaceNavigationButton } from './PlaceNavigationButton';
import { ClientItineraryDocument } from '@/data/schemas/itinerarySchema';

type ActivityType = ClientItineraryDocument['dayPlans'][number]['activities'][number];
type PlacePropsBase = ClientItineraryDocument['dayPlans'][number]['activities'][number]['place'];

type PlaceProps = PlacePropsBase & {
  allActivities?: ActivityType[];
  currentActivityIndex?: number;
};

export const PlaceView: React.FC<PlaceProps> = ({
  name,
  type,
  address,
  location,
  allActivities,
  currentActivityIndex,
}) => (
  <div className='mt-1'>
    <div className='flex items-center gap-2'>
      <PlaceTypeBadge type={type} />
      <span className='font-medium'>{name}</span>
      <div className='flex-shrink-0'>
        <PlaceNavigationButton
          latitude={location?.latitude}
          longitude={location?.longitude}
          activities={allActivities}
          currentActivityIndex={currentActivityIndex}
        />
      </div>
    </div>
    {address && <AddressView address={address} />}
    {location && <LocationView location={location} />}
  </div>
);
