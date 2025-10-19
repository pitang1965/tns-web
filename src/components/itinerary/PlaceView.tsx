import React from 'react';
import { PlaceTypeBadge } from '@/components/itinerary/PlaceTypeBadge';
import { LocationView } from './LocationView';
import { PlaceNavigationButton } from './PlaceNavigationButton';
import { ClientItineraryDocument, ServerItineraryDocument } from '@/data/schemas/itinerarySchema';
import { Text } from '@/components/common/Typography';

type ClientActivityType =
  ClientItineraryDocument['dayPlans'][number]['activities'][number];
type ServerActivityType =
  ServerItineraryDocument['dayPlans'][number]['activities'][number];
type ActivityType = ClientActivityType | ServerActivityType;

type PlacePropsBase =
  ClientItineraryDocument['dayPlans'][number]['activities'][number]['place'];

type PlaceProps = PlacePropsBase & {
  allActivities?: ActivityType[];
  currentActivityIndex?: number;
  url?: string | null;
};

export const PlaceView: React.FC<PlaceProps> = ({
  name,
  type,
  address,
  location,
  allActivities,
  currentActivityIndex,
  url,
}) => {
  const lat = location?.latitude;
  const lng = location?.longitude;

  return (
  <div className='mt-1'>
    <div className='flex items-center gap-2'>
      <PlaceTypeBadge type={type} />
      {url ? (
        <a
          href={url}
          target='_blank'
          rel='noopener noreferrer'
          className='font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1'
        >
          {name}
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='14'
            height='14'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='inline-block'
          >
            <path d='M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' />
            <polyline points='15 3 21 3 21 9' />
            <line x1='10' y1='14' x2='21' y2='3' />
          </svg>
        </a>
      ) : (
        <span className='font-medium'>{name}</span>
      )}
      <div className='flex-shrink-0'>
        <PlaceNavigationButton
          latitude={lat}
          longitude={lng}
          activities={allActivities}
          currentActivityIndex={currentActivityIndex}
        />
      </div>
    </div>
    {address && <Text>{address}</Text>}
    {location && <LocationView location={location} />}
  </div>
  );
};
