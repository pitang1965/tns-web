'use client';

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
import { formatDate } from '@/lib/date';

type ShachuHakuSpotItemProps = {
  spot: CampingSpotWithId;
  onNavigateToDetail: (spotId: string) => void;
};

export function ShachuHakuSpotItem({
  spot,
  onNavigateToDetail,
}: ShachuHakuSpotItemProps) {
  return (
    <div
      className='border rounded-lg p-4 hover:shadow-lg hover:scale-[1.02] hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 cursor-pointer'
      onClick={() => onNavigateToDetail(spot._id)}
    >
      <div className='flex justify-between items-start'>
        <div className='flex-1'>
          <h3 className='font-semibold text-lg'>{spot.name}</h3>
          <p className='text-gray-600 dark:text-gray-300'>{spot.address}</p>
          {spot.updatedAt && (
            <p className='text-xs text-gray-500 dark:text-gray-500 mt-1'>
              {formatDate(spot.updatedAt.toString())}更新
            </p>
          )}
          <div className='flex gap-2 mt-2 flex-wrap'>
            <Badge className={`${getTypeColor(spot.type)} text-white`}>
              {CampingSpotTypeLabels[spot.type]}
            </Badge>
            <Badge
              className={`${getPricingColor(
                spot.pricing.isFree,
                spot.pricing.pricePerNight
              )} text-white`}
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
              )} text-white`}
            >
              治安 {calculateSecurityLevel(spot)}/5 🔒
            </Badge>
            <Badge
              className={`${getRatingColor(
                calculateQuietnessLevel(spot)
              )} text-white`}
            >
              静けさ {calculateQuietnessLevel(spot)}/5 🔇
            </Badge>
            {spot.isVerified && (
              <Badge className='bg-blue-500 text-white hover:bg-blue-600'>
                ✓ 確認済み
              </Badge>
            )}
          </div>
          {spot.notes && (
            <p className='text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2'>
              {spot.notes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
