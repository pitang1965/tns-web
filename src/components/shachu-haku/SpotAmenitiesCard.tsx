import { Car, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CampingSpotWithId } from '@/data/schemas/campingSpot';

type SpotAmenitiesCardProps = {
  spot: CampingSpotWithId;
};

export function SpotAmenitiesCard({ spot }: SpotAmenitiesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>設備</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-2 gap-3 text-sm'>
          <div className='flex items-center gap-2'>
            <Car
              className={`w-4 h-4 ${
                spot.hasRoof ? 'text-green-600' : 'text-gray-400'
              }`}
            />
            <span
              className={
                spot.hasRoof
                  ? 'text-green-700 dark:text-green-400'
                  : 'text-gray-500 dark:text-gray-400'
              }
            >
              屋根{spot.hasRoof ? 'あり' : 'なし'}
            </span>
          </div>
          <div className='flex items-center gap-2'>
            <Zap
              className={`w-4 h-4 ${
                spot.hasPowerOutlet ? 'text-green-600' : 'text-gray-400'
              }`}
            />
            <span
              className={
                spot.hasPowerOutlet
                  ? 'text-green-700 dark:text-green-400'
                  : 'text-gray-500 dark:text-gray-400'
              }
            >
              電源{spot.hasPowerOutlet ? 'あり' : 'なし'}
            </span>
          </div>
        </div>

        {spot.amenities && spot.amenities.length > 0 && (
          <div className='mt-3'>
            <div className='font-semibold text-gray-900 dark:text-gray-100 mb-2'>
              その他設備
            </div>
            <div className='text-sm text-gray-700 dark:text-gray-300'>
              {spot.amenities.join('、')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
