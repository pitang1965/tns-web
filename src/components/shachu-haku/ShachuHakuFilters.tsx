'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin, Search, Navigation, Filter } from 'lucide-react';
import {
  CampingSpotTypeLabels,
  PrefectureOptions,
} from '@/data/schemas/campingSpot';
import {
  PREFECTURE_COORDINATES,
  REGION_COORDINATES,
} from '@/lib/prefectureCoordinates';
import { useToast } from '@/components/ui/use-toast';

interface ShachuHakuFiltersProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  onPrefectureJump: (prefecture: string) => void;
  onRegionJump: (region: string) => void;
  onCurrentLocation: () => void;
}

export default function ShachuHakuFilters({
  searchTerm,
  onSearchTermChange,
  typeFilter,
  onTypeFilterChange,
  onPrefectureJump,
  onRegionJump,
  onCurrentLocation,
}: ShachuHakuFiltersProps) {
  return (
    <Card className='mb-4'>
      <CardContent className='pt-4 pb-4'>
        {/* Mobile Layout */}
        <div className='block xl:hidden space-y-3'>
          {/* Location Jump */}
          <div className='space-y-2'>
            <div className='flex items-center gap-2'>
              <MapPin className='w-4 h-4 text-gray-500 dark:text-gray-400' />
              <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                表示範囲:
              </span>
            </div>

            <div className='flex flex-wrap gap-1 items-center'>
              <Button
                onClick={onCurrentLocation}
                size='sm'
                variant='outline'
                className='h-7 text-xs'
              >
                <Navigation className='w-3 h-3 mr-1' />
                現在地
              </Button>

              {Object.keys(REGION_COORDINATES).map((region) => (
                <Button
                  key={region}
                  variant='ghost'
                  size='sm'
                  onClick={() => onRegionJump(region)}
                  className='text-xs px-2 h-7'
                >
                  {region}
                </Button>
              ))}

              <Select onValueChange={onPrefectureJump}>
                <SelectTrigger className='w-[120px] h-7 text-xs'>
                  <SelectValue placeholder='都道府県...' />
                </SelectTrigger>
                <SelectContent>
                  {PrefectureOptions.map((prefecture) => (
                    <SelectItem key={prefecture} value={prefecture}>
                      {prefecture}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search and Type Filter */}
          <div className='flex flex-col md:flex-row gap-2 items-start md:items-center pt-2 border-t border-gray-200 dark:border-gray-700'>
            <div className='flex items-center gap-2'>
              <Filter className='w-4 h-4 text-gray-500 dark:text-gray-400' />
              <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                絞り込み:
              </span>
            </div>
            <div className='flex flex-col sm:flex-row gap-2 flex-1'>
              <div className='relative flex-1'>
                <Search className='absolute left-3 top-2.5 h-4 w-4 text-gray-400' />
                <Input
                  placeholder='名前で検索...'
                  value={searchTerm}
                  onChange={(e) => onSearchTermChange(e.target.value)}
                  className='pl-10 h-9'
                />
              </div>
              <Select value={typeFilter} onValueChange={onTypeFilterChange}>
                <SelectTrigger className='h-9 w-full sm:w-[180px]'>
                  <SelectValue placeholder='全種別' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>全種別</SelectItem>
                  {Object.entries(CampingSpotTypeLabels).map(
                    ([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Desktop Layout (xl and above) */}
        <div className='hidden xl:flex gap-4 items-center'>
          {/* Location Jump */}
          <div className='flex items-center gap-2'>
            <MapPin className='w-4 h-4 text-gray-500 dark:text-gray-400' />
            <span className='text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap'>
              表示範囲:
            </span>

            <Button
              onClick={onCurrentLocation}
              size='sm'
              variant='outline'
              className='h-7 text-xs'
            >
              <Navigation className='w-3 h-3 mr-1' />
              現在地
            </Button>

            <div className='flex items-center gap-1'>
              {Object.keys(REGION_COORDINATES).map((region) => (
                <Button
                  key={region}
                  variant='ghost'
                  size='sm'
                  onClick={() => onRegionJump(region)}
                  className='text-xs px-2 h-7'
                >
                  {region}
                </Button>
              ))}
            </div>

            <Select onValueChange={onPrefectureJump}>
              <SelectTrigger className='w-[120px] h-7 text-xs'>
                <SelectValue placeholder='都道府県...' />
              </SelectTrigger>
              <SelectContent>
                {PrefectureOptions.map((prefecture) => (
                  <SelectItem key={prefecture} value={prefecture}>
                    {prefecture}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vertical Divider */}
          <div className='h-8 w-px bg-gray-200 dark:bg-gray-700' />

          {/* Search and Type Filter */}
          <div className='flex items-center gap-2 flex-1'>
            <Filter className='w-4 h-4 text-gray-500 dark:text-gray-400' />
            <span className='text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap'>
              絞り込み:
            </span>
            <div className='flex gap-2 flex-1'>
              <div className='relative flex-1 max-w-xs'>
                <Search className='absolute left-3 top-2.5 h-4 w-4 text-gray-400' />
                <Input
                  placeholder='名前で検索...'
                  value={searchTerm}
                  onChange={(e) => onSearchTermChange(e.target.value)}
                  className='pl-10 h-9'
                />
              </div>
              <Select value={typeFilter} onValueChange={onTypeFilterChange}>
                <SelectTrigger className='h-9 w-[180px]'>
                  <SelectValue placeholder='全種別' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>全種別</SelectItem>
                  {Object.entries(CampingSpotTypeLabels).map(
                    ([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
