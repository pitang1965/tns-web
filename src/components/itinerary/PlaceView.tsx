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
  isOwner?: boolean; // 所有者かどうか（自宅の座標・住所表示制御用）
};

export const PlaceView: React.FC<PlaceProps> = ({
  name,
  type,
  address,
  location,
  allActivities,
  currentActivityIndex,
  url,
  isOwner = false,
}) => {
  // 自宅タイプかつ非所有者の場合は座標・住所を非表示にする
  const isHomeType = type === 'HOME';
  const shouldHideLocationInfo = isHomeType && !isOwner;

  const lat = shouldHideLocationInfo ? undefined : location?.latitude;
  const lng = shouldHideLocationInfo ? undefined : location?.longitude;
  const displayAddress = shouldHideLocationInfo ? null : address;
  const displayLocation = shouldHideLocationInfo ? null : location;

  return (
  <div className='mt-1'>
    <div className='flex items-center gap-2'>
      <PlaceTypeBadge type={type} />
      {url ? (
        <a
          href={url}
          target='_blank'
          rel='noopener noreferrer'
          aria-label={name || 'リンクを開く'}
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
            aria-hidden='true'
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
      {isHomeType && isOwner && (
        <span className='text-xs text-muted-foreground'>
          旅程を公開しても、自宅の座標や住所は公開されません
        </span>
      )}
    </div>
    {displayAddress && <Text>{displayAddress}</Text>}
    {displayLocation && <LocationView location={displayLocation} />}
  </div>
  );
};
