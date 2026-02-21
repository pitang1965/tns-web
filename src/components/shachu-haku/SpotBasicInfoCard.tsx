import { ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CampingSpotWithId, CampingSpotTypeLabels } from '@/data/schemas/campingSpot';

type SpotBasicInfoCardProps = {
  spot: CampingSpotWithId;
};

export function SpotBasicInfoCard({ spot }: SpotBasicInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>基本情報</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid grid-cols-2 gap-4 text-sm'>
          <div>
            <div className='font-semibold text-gray-900 dark:text-gray-100'>
              都道府県
            </div>
            <div className='text-gray-700 dark:text-gray-300'>
              {spot.prefecture}
            </div>
          </div>
          <div>
            <div className='font-semibold text-gray-900 dark:text-gray-100'>
              種別
            </div>
            <div className='text-gray-700 dark:text-gray-300'>
              {CampingSpotTypeLabels[spot.type]}
            </div>
          </div>
          <div>
            <div className='font-semibold text-gray-900 dark:text-gray-100'>
              料金
            </div>
            <div className='text-gray-700 dark:text-gray-300'>
              {spot.pricing.isFree
                ? '無料'
                : spot.pricing.pricePerNight
                ? `¥${spot.pricing.pricePerNight}/泊`
                : '有料：？円/泊'}
            </div>
          </div>
          {spot.capacity && (
            <div>
              <div className='font-semibold text-gray-900 dark:text-gray-100'>
                収容台数
              </div>
              <div className='text-gray-700 dark:text-gray-300'>
                {spot.capacity}台
              </div>
            </div>
          )}
          {spot.elevation && (
            <div>
              <div className='font-semibold text-gray-900 dark:text-gray-100'>
                標高
              </div>
              <div className='text-gray-700 dark:text-gray-300'>
                {spot.elevation}m
              </div>
            </div>
          )}
        </div>
        {spot.url && (
          <div className='pt-2 border-t border-gray-200 dark:border-gray-700'>
            <div className='font-semibold text-gray-900 dark:text-gray-100 mb-1'>
              参考URL
            </div>
            <a
              href={spot.url}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm break-all'
            >
              <ExternalLink className='w-3 h-3 flex-shrink-0' />
              公式サイト・詳細情報
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
