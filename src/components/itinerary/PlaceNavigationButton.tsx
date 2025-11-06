'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Map, Route } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ServerItineraryDocument, ClientItineraryDocument } from '@/data/schemas/itinerarySchema';
import { useNavigation } from '@/hooks/useNavigation';

type ServerActivity =
  ServerItineraryDocument['dayPlans'][number]['activities'][number];
type ClientActivity =
  ClientItineraryDocument['dayPlans'][number]['activities'][number];
type Activity = ServerActivity | ClientActivity;

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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  const isValid = isValidCoordinate();

  // マウント前または無効な座標の場合は無効ボタンを表示
  if (!isMounted || !isValid) {
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
        <button
          className='inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-3 w-full cursor-pointer'
        >
          <MapPin className='w-4 h-4' />
          地図を開く
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem onClick={openCurrentLocationRoute} className='cursor-pointer'>
          <Navigation className='mr-2 h-4 w-4' />
          <span>現在地からのルート検索</span>
        </DropdownMenuItem>
        {canShowMultiWaypointRoute() && (
          <DropdownMenuItem onClick={openCurrentToFinalRoute} className='cursor-pointer'>
            <Route className='mr-2 h-4 w-4' />
            <span>現在地から最終地までのルート検索</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={showOnMap} className='cursor-pointer'>
          <Map className='mr-2 h-4 w-4' />
          <span>地図で表示</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
