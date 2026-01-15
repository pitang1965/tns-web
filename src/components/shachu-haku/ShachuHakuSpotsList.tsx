'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CampingSpotWithId } from '@/data/schemas/campingSpot';
import { ClientSideFilterValues } from './ClientSideFilters';
import {
  filterSpotsClientSide,
  hasActiveClientFilters,
} from '@/lib/clientSideFilterSpots';
import { getActiveFilterDescriptions } from '@/lib/filterDescriptions';
import { ShachuHakuSpotItem } from './ShachuHakuSpotItem';
import { AdLink } from './AdLink';

type ShachuHakuSpotsListProps = {
  spots: CampingSpotWithId[];
  total: number;
  page: number;
  totalPages: number;
  onSpotSelect: (spot: CampingSpotWithId) => void;
  onNavigateToDetail: (spotId: string) => void;
  onPageChange: (page: number) => void;
  clientFilters: ClientSideFilterValues;
  searchTerm?: string;
  typeFilter?: string;
};

export function ShachuHakuSpotsList({
  spots,
  total,
  page,
  totalPages,
  onSpotSelect,
  onNavigateToDetail,
  onPageChange,
  clientFilters,
  searchTerm = '',
  typeFilter = 'all',
}: ShachuHakuSpotsListProps) {
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
          <CardTitle className='flex items-center justify-between gap-2'>
            <span>車中泊スポット一覧</span>
            <AdLink href="https://amzn.to/4oy6Dbc" label="ポータブル電源セール" shortLabel="ポタ電セール" />
          </CardTitle>
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
        <CardTitle className='flex items-center justify-between gap-2'>
          <span>
            {hasFilters
              ? `このページに${filteredSpots.length}件表示中`
              : `${total}件中 ${(page - 1) * pageSize + 1}-${Math.min(
                  page * pageSize,
                  total
                )}件を表示`}
          </span>
          <AdLink href="https://amzn.to/4oy6Dbc" label="ポータブル電源セール" shortLabel="ポタ電セール" />
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
            <ShachuHakuSpotItem
              key={spot._id}
              spot={spot}
              onNavigateToDetail={onNavigateToDetail}
            />
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='flex justify-center items-center gap-2 mt-6'>
              <Button
                variant='outline'
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page === 1}
                className='cursor-pointer'
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
                className='cursor-pointer'
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
