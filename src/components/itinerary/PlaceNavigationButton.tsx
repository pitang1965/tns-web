import React from 'react';
import { MapPin, Navigation, Map, Route } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ServerItineraryDocument } from '@/data/schemas/itinerarySchema';
import { useNavigation } from '@/hooks/useNavigation';

type Activity =
  ServerItineraryDocument['dayPlans'][number]['activities'][number];

type PlaceNavigationButtonProps = {
  latitude?: number;
  longitude?: number;
  className?: string;
  activities?: Activity[];
  currentActivityIndex?: number;
};

export const PlaceNavigationButton: React.FC<PlaceNavigationButtonProps> = ({
  latitude,
  longitude,
  className = '',
  activities = [],
  currentActivityIndex = -1,
}) => {
  const {
    openCurrentLocationRoute,
    openCurrentToFinalRoute,
    showOnMap,
    canShowMultiWaypointRoute,
    isValidCoordinate,
  } = useNavigation({
    latitude,
    longitude,
    activities,
    currentActivityIndex,
  });

  if (!isValidCoordinate()) {
    return (
      <Button
        disabled
        variant='outline'
        size='sm'
        className={`w-full ${className}`}
        aria-label='ナビゲーション (無効)'
      >
        <MapPin className='w-4 h-4' />
        地図を開く
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className='w-full'
        >
          <MapPin className='w-4 h-4' />
          地図を開く
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem onClick={openCurrentLocationRoute}>
          <Navigation className='mr-2 h-4 w-4' />
          <span>現在地からのルート検索</span>
        </DropdownMenuItem>
        {canShowMultiWaypointRoute() && (
          <DropdownMenuItem onClick={openCurrentToFinalRoute}>
            <Route className='mr-2 h-4 w-4' />
            <span>現在地から最終地までのルート検索</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={showOnMap}>
          <Map className='mr-2 h-4 w-4' />
          <span>地図で表示</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
