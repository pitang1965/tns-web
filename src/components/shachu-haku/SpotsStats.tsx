'use client';

import { use } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CampingSpotWithId } from '@/data/schemas/campingSpot';

interface SpotsStatsProps {
  spotsPromise: Promise<{
    spots: CampingSpotWithId[];
    total: number;
    page: number;
    totalPages: number;
  }>;
}

export function SpotsStats({ spotsPromise }: SpotsStatsProps) {
  // use フックでPromiseを直接扱う
  const { spots } = use(spotsPromise);

  const freeSpots = spots.filter((s) => s.pricing.isFree).length;
  const verifiedSpots = spots.filter((s) => s.isVerified).length;
  const uniquePrefectures = new Set(spots.map((s) => s.prefecture)).size;

  return (
    <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
      <Card>
        <CardContent className='p-4'>
          <div className='text-2xl font-bold text-blue-600'>{spots.length}</div>
          <div className='text-sm text-gray-600 dark:text-gray-300'>
            総スポット数
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className='p-4'>
          <div className='text-2xl font-bold text-green-600'>{freeSpots}</div>
          <div className='text-sm text-gray-600 dark:text-gray-300'>
            無料スポット
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className='p-4'>
          <div className='text-2xl font-bold text-yellow-600'>
            {verifiedSpots}
          </div>
          <div className='text-sm text-gray-600 dark:text-gray-300'>
            確認済み
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className='p-4'>
          <div className='text-2xl font-bold text-purple-600'>
            {uniquePrefectures}
          </div>
          <div className='text-sm text-gray-600 dark:text-gray-300'>
            都道府県数
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
