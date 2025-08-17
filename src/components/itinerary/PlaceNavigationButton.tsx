import React from 'react';
import { MapPin, Navigation, Map, Route } from 'lucide-react';
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
      <button
        disabled
        className={`flex items-center gap-2 text-sm px-3 h-8 border border-input bg-background rounded-md text-muted-foreground cursor-not-allowed ${className}`}
        aria-label='ナビゲーション (無効)'
      >
        <MapPin className='w-4 h-4' />
        <span className='text-sm'>地図を開く</span>
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className='flex items-center justify-center gap-2 text-sm px-3 border bg-background hover:bg-accent hover:text-accent-foreground rounded-md h-8 text-foreground w-full'>
        <MapPin className='w-4 h-4' />
        地図を開く
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
