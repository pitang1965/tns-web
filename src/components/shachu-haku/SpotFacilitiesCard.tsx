import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatFacilityDistance } from '@/lib/formatDistance';
import { CampingSpotWithId } from '@/data/schemas/campingSpot';

type SpotFacilitiesCardProps = {
  spot: CampingSpotWithId;
};

export function SpotFacilitiesCard({ spot }: SpotFacilitiesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>周辺施設</CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
        {spot.distanceToToilet != null && (
          <div className='flex justify-between items-center'>
            <span className='text-gray-700 dark:text-gray-300'>トイレ</span>
            <span className='font-semibold text-gray-900 dark:text-gray-100'>
              {formatFacilityDistance(spot.distanceToToilet)}
            </span>
          </div>
        )}
        {spot.distanceToBath != null && (
          <div className='flex justify-between items-center'>
            <span className='text-gray-700 dark:text-gray-300'>入浴施設</span>
            <span className='font-semibold text-gray-900 dark:text-gray-100'>
              {formatFacilityDistance(spot.distanceToBath)}
            </span>
          </div>
        )}
        {spot.distanceToConvenience != null && (
          <div className='flex justify-between items-center'>
            <span className='text-gray-700 dark:text-gray-300'>コンビニ</span>
            <span className='font-semibold text-gray-900 dark:text-gray-100'>
              {formatFacilityDistance(spot.distanceToConvenience)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
