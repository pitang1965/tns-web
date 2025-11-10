'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CampingSpotWithId,
  CampingSpotTypeLabels,
} from '@/data/schemas/campingSpot';
import {
  calculateSecurityLevel,
  calculateQuietnessLevel,
} from '@/lib/campingSpotUtils';
import {
  getTypeColor,
  getRatingColor,
  getPricingColor,
} from '@/lib/spotColorUtils';
import { formatDistance } from '@/lib/formatDistance';

type SpotPopupProps = {
  spot: CampingSpotWithId;
  onClose: () => void;
  actionButton: React.ReactNode;
};

export function SpotPopup({ spot, onClose, actionButton }: SpotPopupProps) {
  return (
    <div className='bg-white dark:bg-gray-800 border-2 border-blue-500 rounded-lg shadow-lg p-3 relative max-h-[60vh] overflow-y-auto'>
      <Button
        variant='ghost'
        size='sm'
        onClick={onClose}
        className='absolute top-1 right-1 h-7 w-7 p-0 cursor-pointer z-10'
        title='閉じる'
      >
        ✕
      </Button>
      <div className='flex items-start gap-2 mb-2 pr-8'>
        <h3 className='font-semibold text-base leading-tight flex-grow'>
          {spot.name}
        </h3>
        {actionButton}
      </div>
      <div className='space-y-2'>
        <div className='flex gap-1.5 flex-wrap'>
          <Badge className={`${getTypeColor(spot.type)} text-white text-xs`}>
            {CampingSpotTypeLabels[spot.type]}
          </Badge>
          <Badge
            className={`${getPricingColor(
              spot.pricing.isFree,
              spot.pricing.pricePerNight
            )} text-white text-xs`}
          >
            {spot.pricing.isFree
              ? '無料'
              : spot.pricing.pricePerNight
              ? `¥${spot.pricing.pricePerNight}`
              : '有料：？円'}
          </Badge>
          <Badge
            className={`${getRatingColor(
              calculateSecurityLevel(spot)
            )} text-white text-xs`}
          >
            🔒 {calculateSecurityLevel(spot)}/5
          </Badge>
          <Badge
            className={`${getRatingColor(
              calculateQuietnessLevel(spot)
            )} text-white text-xs`}
          >
            🔇 {calculateQuietnessLevel(spot)}/5
          </Badge>
        </div>

        {/* 追加情報 */}
        <div className='text-sm space-y-1 text-gray-700 dark:text-gray-300'>
          <div className='text-gray-900 dark:text-gray-100'>
            {spot.address || spot.prefecture}
          </div>
          {/* 距離・標高情報を1行に（折り返し可能） */}
          <div className='flex flex-wrap gap-x-3 gap-y-0.5'>
            {spot.distanceToToilet && (
              <span>
                <strong className='text-gray-900 dark:text-gray-100'>
                  トイレ:
                </strong>{' '}
                {formatDistance(spot.distanceToToilet)}
              </span>
            )}
            {spot.distanceToBath && (
              <span>
                <strong className='text-gray-900 dark:text-gray-100'>
                  入浴施設:
                </strong>{' '}
                {formatDistance(spot.distanceToBath)}
              </span>
            )}
            {spot.distanceToConvenience && (
              <span>
                <strong className='text-gray-900 dark:text-gray-100'>
                  コンビニ:
                </strong>{' '}
                {formatDistance(spot.distanceToConvenience)}
              </span>
            )}
            {spot.elevation && (
              <span>
                <strong className='text-gray-900 dark:text-gray-100'>
                  標高:
                </strong>{' '}
                {spot.elevation}m
              </span>
            )}
          </div>
          {(spot.hasRoof || spot.hasPowerOutlet) && (
            <div className='flex gap-1.5 flex-wrap mt-1'>
              {spot.hasRoof && (
                <Badge
                  variant='secondary'
                  className='text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                >
                  屋根付き
                </Badge>
              )}
              {spot.hasPowerOutlet && (
                <Badge
                  variant='secondary'
                  className='text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                >
                  電源
                </Badge>
              )}
            </div>
          )}
          {spot.notes && (
            <div className='mt-2'>
              <strong className='text-gray-900 dark:text-gray-100'>
                備考:{' '}
              </strong>
              <span className='text-gray-700 dark:text-gray-300 whitespace-pre-wrap'>
                {spot.notes}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
