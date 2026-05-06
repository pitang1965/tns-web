'use client';

import { Navigation, Map } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { formatFacilityDistance } from '@/lib/formatDistance';
import { openCurrentLocationRoute, showSpotOnMap } from '@/lib/mapNavigation';
import { CampingSpotWithId } from '@/data/schemas/campingSpot';

type SpotFacilitiesCardProps = {
  spot: CampingSpotWithId;
};

type FacilityRowProps = {
  label: string;
  distance: number | null | undefined;
  coordinates: [number, number] | null | undefined;
};

function FacilityRow({ label, distance, coordinates }: FacilityRowProps) {
  const { toast } = useToast();

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-gray-700 dark:text-gray-300">{label}</span>
        <span className="font-semibold text-gray-900 dark:text-gray-100">
          {formatFacilityDistance(distance)}
        </span>
      </div>
      {coordinates && (
        <div className="flex gap-1 justify-end">
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs cursor-pointer"
            onClick={() => openCurrentLocationRoute(coordinates, toast)}
          >
            <Navigation className="w-3 h-3 mr-1" />
            ルート検索
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs cursor-pointer"
            onClick={() => showSpotOnMap(coordinates, toast)}
          >
            <Map className="w-3 h-3 mr-1" />
            地図で表示
          </Button>
        </div>
      )}
    </div>
  );
}

export function SpotFacilitiesCard({ spot }: SpotFacilitiesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>周辺施設</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {spot.distanceToToilet != null && (
          <FacilityRow
            label="トイレ"
            distance={spot.distanceToToilet}
            coordinates={spot.nearbyToiletCoordinates}
          />
        )}
        {spot.distanceToBath != null && (
          <FacilityRow
            label="入浴施設"
            distance={spot.distanceToBath}
            coordinates={spot.nearbyBathCoordinates}
          />
        )}
        {spot.distanceToConvenience != null && (
          <FacilityRow
            label="コンビニ"
            distance={spot.distanceToConvenience}
            coordinates={spot.nearbyConvenienceCoordinates}
          />
        )}
      </CardContent>
    </Card>
  );
}
