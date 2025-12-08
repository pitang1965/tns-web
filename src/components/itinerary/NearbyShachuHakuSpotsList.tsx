'use client';

import { CampingSpotWithDistance } from '@/lib/utils/campingSpotConverter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, ExternalLink, Banknote, Umbrella, Plug } from 'lucide-react';
import { formatFacilityDistance } from '@/lib/formatDistance';

type NearbyShachuHakuSpotsListProps = {
  spots: CampingSpotWithDistance[];
  onSelect: (spot: CampingSpotWithDistance) => void;
  selectedSpotId?: string;
};

/**
 * Formats distance in meters to a readable string
 */
function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

export function NearbyShachuHakuSpotsList({
  spots,
  onSelect,
  selectedSpotId,
}: NearbyShachuHakuSpotsListProps) {
  if (spots.length === 0) {
    return (
      <div className='flex items-center justify-center p-8 text-center text-muted-foreground'>
        <div>
          <MapPin className='mx-auto mb-2 h-12 w-12 opacity-50' />
          <p>近くに車中泊スポットが見つかりませんでした</p>
          <p className='text-sm'>別の地点を選択してください</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-sm font-medium text-muted-foreground'>
          近くの車中泊スポット ({spots.length}件)
        </h3>
      </div>

      <ScrollArea className='h-[400px] pr-4'>
        <div className='space-y-3'>
          {spots.map((spot) => {
            const isSelected = selectedSpotId === spot._id;

            return (
              <Card
                key={spot._id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected
                    ? 'border-primary bg-primary/5 ring-2 ring-primary'
                    : ''
                }`}
                onClick={() => onSelect(spot)}
              >
                <div className='p-4 space-y-3'>
                  {/* Header: Name and Distance */}
                  <div className='flex items-start justify-between gap-4'>
                    <div className='flex-1 min-w-0'>
                      <h4 className='font-semibold text-base truncate'>
                        {spot.name}
                      </h4>
                      {spot.address && (
                        <p className='text-xs text-muted-foreground truncate mt-1'>
                          {spot.address}
                        </p>
                      )}
                    </div>
                    <div className='shrink-0 flex items-center gap-1 text-primary font-semibold'>
                      <MapPin className='h-4 w-4' />
                      <span className='text-sm'>
                        {formatDistance(spot.distance)}
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className='flex flex-wrap gap-2'>
                    {/* Pricing */}
                    <div className='inline-flex items-center gap-1 px-2 py-1 bg-secondary rounded-md text-xs'>
                      <Banknote className='h-3 w-3' />
                      {spot.pricing.isFree ? (
                        <span className='font-medium text-green-600'>無料</span>
                      ) : spot.pricing.pricePerNight !== undefined ? (
                        <span>
                          ¥{spot.pricing.pricePerNight.toLocaleString()}/泊
                        </span>
                      ) : (
                        <span>料金不明</span>
                      )}
                    </div>

                    {/* Amenities */}
                    {spot.hasRoof && (
                      <div className='inline-flex items-center gap-1 px-2 py-1 bg-secondary rounded-md text-xs'>
                        <Umbrella className='h-3 w-3' />
                        <span>屋根あり</span>
                      </div>
                    )}
                    {spot.hasPowerOutlet && (
                      <div className='inline-flex items-center gap-1 px-2 py-1 bg-secondary rounded-md text-xs'>
                        <Plug className='h-3 w-3' />
                        <span>電源あり</span>
                      </div>
                    )}
                  </div>

                  {/* Facilities distances */}
                  <div className='flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground'>
                    {spot.distanceToToilet !== undefined && (
                      <span>
                        トイレ: {formatFacilityDistance(spot.distanceToToilet)}
                      </span>
                    )}
                    {spot.distanceToBath !== undefined && (
                      <span>
                        入浴施設: {formatFacilityDistance(spot.distanceToBath)}
                      </span>
                    )}
                    {spot.distanceToConvenience !== undefined && (
                      <span>
                        コンビニ: {formatFacilityDistance(spot.distanceToConvenience)}
                      </span>
                    )}
                  </div>

                  {/* URL link */}
                  {spot.url && (
                    <div className='pt-2 border-t'>
                      <a
                        href={spot.url}
                        target='_blank'
                        rel='noopener noreferrer'
                        onClick={(e) => e.stopPropagation()}
                        className='inline-flex items-center gap-1 text-xs text-primary hover:underline'
                      >
                        <ExternalLink className='h-3 w-3' />
                        詳細を見る
                      </a>
                    </div>
                  )}

                  {/* Select button for mobile/clarity */}
                  {isSelected && (
                    <div className='pt-2'>
                      <Button
                        variant='default'
                        size='sm'
                        className='w-full'
                        disabled
                      >
                        選択中
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
