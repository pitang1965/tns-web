'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit } from 'lucide-react';
import {
  CampingSpotWithId,
  CampingSpotTypeLabels,
} from '@/data/schemas/campingSpot';
import {
  calculateSecurityLevel,
  calculateQuietnessLevel,
} from '@/lib/campingSpotUtils';
import { ClientSideFilterValues } from '@/components/shachu-haku/ClientSideFilters';
import {
  filterSpotsClientSide,
  hasActiveClientFilters,
} from '@/lib/clientSideFilterSpots';
import { getActiveFilterDescriptions } from '@/lib/filterDescriptions';

// スポットタイプごとの色分け関数
const getTypeColor = (type: string) => {
  switch (type) {
    case 'roadside_station':
      return 'bg-blue-600 hover:bg-blue-700';
    case 'sa_pa':
      return 'bg-purple-600 hover:bg-purple-700';
    case 'rv_park':
      return 'bg-emerald-600 hover:bg-emerald-700';
    case 'convenience_store':
      return 'bg-cyan-600 hover:bg-cyan-700';
    case 'parking_lot':
      return 'bg-slate-600 hover:bg-slate-700';
    case 'other':
      return 'bg-gray-600 hover:bg-gray-700';
    default:
      return 'bg-gray-500 hover:bg-gray-600';
  }
};

// 評価レベルごとの色分け関数
const getRatingColor = (rating: number) => {
  if (rating >= 5) return 'bg-green-600 hover:bg-green-700';
  if (rating >= 4) return 'bg-blue-600 hover:bg-blue-700';
  if (rating >= 3) return 'bg-yellow-600 hover:bg-yellow-700';
  if (rating >= 2) return 'bg-orange-600 hover:bg-orange-700';
  return 'bg-red-600 hover:bg-red-700';
};

// 料金レベルごとの色分け関数
const getPricingColor = (isFree: boolean, pricePerNight?: number) => {
  if (isFree) return 'bg-green-500 hover:bg-green-600';
  if (!pricePerNight) return 'bg-gray-500 hover:bg-gray-600';
  if (pricePerNight <= 1000) return 'bg-yellow-500 hover:bg-yellow-600';
  if (pricePerNight <= 2000) return 'bg-orange-500 hover:bg-orange-600';
  return 'bg-red-500 hover:bg-red-600';
};

interface AdminSpotsListProps {
  spots: CampingSpotWithId[];
  total: number;
  page: number;
  totalPages: number;
  onSpotSelect: (spot: CampingSpotWithId) => void;
  onPageChange: (page: number) => void;
  clientFilters: ClientSideFilterValues;
  searchTerm?: string;
  typeFilter?: string;
}

export function AdminSpotsList({
  spots,
  total,
  page,
  totalPages,
  onSpotSelect,
  onPageChange,
  clientFilters,
  searchTerm = '',
  typeFilter = 'all',
}: AdminSpotsListProps) {
  // Apply client-side filters
  const filteredSpots = filterSpotsClientSide(spots, clientFilters);
  const hasFilters = hasActiveClientFilters(clientFilters);

  // Generate active filter descriptions for display
  const activeFilterDescriptions = getActiveFilterDescriptions(
    searchTerm,
    typeFilter,
    clientFilters
  );

  const pageSize = 20;

  if (filteredSpots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>車中泊スポット一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-center py-8 text-gray-500'>
            {hasFilters
              ? '詳細フィルターの条件に一致する車中泊スポットがありません'
              : '条件に一致する車中泊スポットがありません'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {hasFilters
            ? `このページに${filteredSpots.length}件表示中`
            : `${total}件中 ${(page - 1) * pageSize + 1}-${Math.min(
                page * pageSize,
                total
              )}件を表示`}
        </CardTitle>
        {activeFilterDescriptions.length > 0 && (
          <div className='text-sm text-muted-foreground space-y-1 mt-2'>
            {activeFilterDescriptions.map((desc, index) => (
              <div key={index}>{desc}</div>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {filteredSpots.map((spot) => (
            <div
              key={spot._id}
              className='border rounded-lg p-4 hover:shadow-md transition-shadow'
            >
              <div className='flex justify-between items-start'>
                <div className='flex-1'>
                  <h3 className='font-semibold text-lg'>{spot.name}</h3>
                  <p className='text-gray-600 dark:text-gray-300'>
                    {spot.address}
                  </p>
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
                <div className='flex gap-2'>
                  <Link href={`/admin/shachu-haku/${spot._id}`}>
                    <Button size='sm' variant='outline' className='cursor-pointer'>
                      <Edit className='w-4 h-4' />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='flex justify-center items-center gap-2 mt-6'>
              <Button
                variant='outline'
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                前へ
              </Button>
              <span className='text-sm text-gray-600 dark:text-gray-300'>
                {page} / {totalPages} ページ
              </span>
              <Button
                variant='outline'
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
              >
                次へ
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
