'use client';

import { use } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CampingSpotWithId } from '@/data/schemas/campingSpot';
import { ClientSideFilterValues } from '@/components/shachu-haku/ClientSideFilters';
import { filterSpotsClientSide } from '@/lib/clientSideFilterSpots';

interface AdminSpotsStatsProps {
  spotsPromise: Promise<{
    spots: CampingSpotWithId[];
    total: number;
    page: number;
    totalPages: number;
  }>;
  clientFilters: ClientSideFilterValues;
}

export function AdminSpotsStats({
  spotsPromise,
  clientFilters,
}: AdminSpotsStatsProps) {
  // use フックでPromiseを直接扱う
  const { spots, total } = use(spotsPromise);

  // Apply client-side filters
  const filteredSpots = filterSpotsClientSide(spots, clientFilters);

  const freeSpots = filteredSpots.filter((s) => s.pricing.isFree).length;
  const verifiedSpots = filteredSpots.filter((s) => s.isVerified).length;
  const uniquePrefectures = new Set(
    filteredSpots.map((s) => s.prefecture)
  ).size;

  return (
    <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
      <Card>
        <CardContent className='p-4'>
          <div className='text-2xl font-bold text-blue-600'>
            {filteredSpots.length}
          </div>
          <div className='text-sm text-gray-600 dark:text-gray-300'>
            総スポット数（現在のページ）
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className='p-4'>
          <div className='text-2xl font-bold text-green-600'>{freeSpots}</div>
          <div className='text-sm text-gray-600 dark:text-gray-300'>
            無料スポット（現在のページ）
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className='p-4'>
          <div className='text-2xl font-bold text-yellow-600'>
            {verifiedSpots}
          </div>
          <div className='text-sm text-gray-600 dark:text-gray-300'>
            確認済み（現在のページ）
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className='p-4'>
          <div className='text-2xl font-bold text-purple-600'>
            {uniquePrefectures}
          </div>
          <div className='text-sm text-gray-600 dark:text-gray-300'>
            都道府県数（現在のページ）
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
