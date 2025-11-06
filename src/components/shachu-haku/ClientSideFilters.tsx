'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, FilterX } from 'lucide-react';

export type ClientSideFilterValues = {
  pricingFilter: 'all' | 'free' | 'paid';
  minSecurityLevel: number;
  minQuietnessLevel: number;
  maxToiletDistance: number | null;
  minElevation: number | null;
  maxElevation: number | null;
};

interface ClientSideFiltersProps {
  filters: ClientSideFilterValues;
  onFiltersChange: (filters: ClientSideFilterValues) => void;
}

export default function ClientSideFilters({
  filters,
  onFiltersChange,
}: ClientSideFiltersProps) {
  const handleReset = () => {
    onFiltersChange({
      pricingFilter: 'all',
      minSecurityLevel: 0,
      minQuietnessLevel: 0,
      maxToiletDistance: null,
      minElevation: null,
      maxElevation: null,
    });
  };

  const activeFiltersCount = [
    filters.pricingFilter !== 'all',
    filters.minSecurityLevel > 0,
    filters.minQuietnessLevel > 0,
    filters.maxToiletDistance !== null,
    filters.minElevation !== null,
    filters.maxElevation !== null,
  ].filter(Boolean).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className='relative inline-flex items-center justify-center h-9 w-9 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer'
          type='button'
        >
          <MoreVertical className='h-4 w-4' />
          {activeFiltersCount > 0 && (
            <span className='absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs'>
              {activeFiltersCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-80' align='end'>
        <div className='flex items-center justify-between px-2 py-1.5'>
          <DropdownMenuLabel className='p-0'>詳細フィルター</DropdownMenuLabel>
          {activeFiltersCount > 0 && (
            <Button
              variant='ghost'
              size='sm'
              onClick={handleReset}
              className='h-8 px-2 cursor-pointer'
            >
              <FilterX className='h-4 w-4 mr-1' />
              リセット
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />

        {/* 料金フィルター */}
        <div className='px-2 py-2'>
          <p className='text-sm font-medium mb-2'>料金</p>
          <DropdownMenuRadioGroup
            value={filters.pricingFilter}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                pricingFilter: value as ClientSideFilterValues['pricingFilter'],
              })
            }
          >
            <DropdownMenuRadioItem value='all'>すべて</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value='free'>無料のみ</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value='paid'>有料のみ</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </div>

        <DropdownMenuSeparator />

        {/* 治安レベル */}
        <div className='px-2 py-2'>
          <p className='text-sm font-medium mb-2'>治安レベル</p>
          <DropdownMenuRadioGroup
            value={filters.minSecurityLevel.toString()}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                minSecurityLevel: parseInt(value),
              })
            }
          >
            <DropdownMenuRadioItem value='0'>すべて</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value='3'>3以上</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value='4'>4以上</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </div>

        <DropdownMenuSeparator />

        {/* 静けさレベル */}
        <div className='px-2 py-2'>
          <p className='text-sm font-medium mb-2'>静けさレベル</p>
          <DropdownMenuRadioGroup
            value={filters.minQuietnessLevel.toString()}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                minQuietnessLevel: parseInt(value),
              })
            }
          >
            <DropdownMenuRadioItem value='0'>すべて</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value='3'>3以上</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value='4'>4以上</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </div>

        <DropdownMenuSeparator />

        {/* トイレまでの距離 */}
        <div className='px-2 py-2'>
          <p className='text-sm font-medium mb-2'>トイレまでの距離</p>
          <DropdownMenuRadioGroup
            value={filters.maxToiletDistance?.toString() || 'all'}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                maxToiletDistance: value === 'all' ? null : parseInt(value),
              })
            }
          >
            <DropdownMenuRadioItem value='all'>すべて</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value='50'>50m以内</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value='100'>100m以内</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value='200'>200m以内</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </div>

        <DropdownMenuSeparator />

        {/* 標高 */}
        <div className='px-2 py-2'>
          <p className='text-sm font-medium mb-2'>標高</p>
          <DropdownMenuRadioGroup
            value={
              filters.minElevation !== null
                ? `min-${filters.minElevation}`
                : filters.maxElevation !== null
                ? `max-${filters.maxElevation}`
                : 'all'
            }
            onValueChange={(value) => {
              if (value === 'all') {
                onFiltersChange({
                  ...filters,
                  minElevation: null,
                  maxElevation: null,
                });
              } else if (value.startsWith('min-')) {
                onFiltersChange({
                  ...filters,
                  minElevation: parseInt(value.substring(4)),
                  maxElevation: null,
                });
              } else if (value.startsWith('max-')) {
                onFiltersChange({
                  ...filters,
                  minElevation: null,
                  maxElevation: parseInt(value.substring(4)),
                });
              }
            }}
          >
            <DropdownMenuRadioItem value='all'>すべて</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value='max-500'>
              500m以下
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value='min-500'>
              500m以上
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value='min-1000'>
              1000m以上
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
