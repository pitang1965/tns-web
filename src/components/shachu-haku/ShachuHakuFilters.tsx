'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { MapPin, Search, Navigation, Filter, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import {
  CampingSpotTypeLabels,
  PrefectureOptions,
} from '@/data/schemas/campingSpot';
import { REGION_COORDINATES } from '@/lib/prefectureCoordinates';
import ClientSideFilters, { ClientSideFilterValues } from './ClientSideFilters';

type ShachuHakuFiltersProps = {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  onPrefectureJump: (prefecture: string) => void;
  onRegionJump: (region: string) => void;
  onCurrentLocation: () => void;
  clientFilters: ClientSideFilterValues;
  onClientFiltersChange: (filters: ClientSideFilterValues) => void;
  onResetAll: () => void;
};

export default function ShachuHakuFilters({
  searchTerm,
  onSearchTermChange,
  typeFilter,
  onTypeFilterChange,
  onPrefectureJump,
  onRegionJump,
  onCurrentLocation,
  clientFilters,
  onClientFiltersChange,
  onResetAll,
}: ShachuHakuFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Count active filters
  const countActiveFilters = () => {
    let count = 0;
    if (searchTerm) count++;
    if (typeFilter !== 'all') count++;
    if (clientFilters.pricingFilter !== 'all') count++;
    if (clientFilters.minSecurityLevel > 0) count++;
    if (clientFilters.minQuietnessLevel > 0) count++;
    if (clientFilters.maxToiletDistance !== null) count++;
    if (clientFilters.minElevation !== null) count++;
    if (clientFilters.maxElevation !== null) count++;
    return count;
  };

  const activeFiltersCount = countActiveFilters();

  // Wrap handlers to auto-close filters on mobile after location jump
  const handlePrefectureJump = (prefecture: string) => {
    onPrefectureJump(prefecture);
    setIsOpen(false);
  };

  const handleRegionJump = (region: string) => {
    onRegionJump(region);
    setIsOpen(false);
  };

  const handleCurrentLocation = () => {
    onCurrentLocation();
    setIsOpen(false);
  };

  return (
    <Card className='mb-4'>
      <CardContent className='pt-4 pb-4'>
        {/* Mobile Layout */}
        <Collapsible
          open={isOpen}
          onOpenChange={setIsOpen}
          className='block 2xl:hidden'
        >
          {/* Trigger Button */}
          <CollapsibleTrigger asChild>
            <Button
              variant='outline'
              className='w-full justify-between h-10 mb-3'
            >
              <div className='flex items-center gap-2'>
                <Filter className='w-4 h-4' />
                <span className='text-sm font-medium'>
                  表示範囲・絞り込み設定
                </span>
                {activeFiltersCount > 0 && (
                  <span className='ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-500 text-white'>
                    {activeFiltersCount}
                  </span>
                )}
              </div>
              {isOpen ? (
                <ChevronUp className='w-4 h-4' />
              ) : (
                <ChevronDown className='w-4 h-4' />
              )}
            </Button>
          </CollapsibleTrigger>

          {/* Collapsible Content */}
          <CollapsibleContent>
            <div className='space-y-3' suppressHydrationWarning>
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
                  onClick={handleCurrentLocation}
                  size='sm'
                  variant='outline'
                  className='h-7 text-xs cursor-pointer'
                >
                  <Navigation className='w-3 h-3 mr-1' />
                  現在地
                </Button>

                {Object.keys(REGION_COORDINATES).map((region) => (
                  <Button
                    key={region}
                    variant='ghost'
                    size='sm'
                    onClick={() => handleRegionJump(region)}
                    className='text-xs px-2 h-7 cursor-pointer'
                  >
                    {region}
                  </Button>
                ))}

                <Select onValueChange={handlePrefectureJump}>
                  <SelectTrigger className='w-[120px] h-7 text-xs cursor-pointer'>
                    <SelectValue placeholder='都道府県...' />
                  </SelectTrigger>
                  <SelectContent>
                    {PrefectureOptions.map((prefecture) => (
                      <SelectItem key={prefecture} value={prefecture} className='cursor-pointer'>
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
                <InputGroup className='flex-1'>
                  <InputGroupAddon>
                    <Search className='h-4 w-4' />
                  </InputGroupAddon>
                  <InputGroupInput
                    placeholder='キーワードで検索...'
                    value={searchTerm}
                    onChange={(e) => onSearchTermChange(e.target.value)}
                  />
                </InputGroup>
                <Select value={typeFilter} onValueChange={onTypeFilterChange}>
                  <SelectTrigger className='h-9 w-full sm:w-[180px] cursor-pointer'>
                    <SelectValue placeholder='全種別' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all' className='cursor-pointer'>全種別</SelectItem>
                    {Object.entries(CampingSpotTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key} className='cursor-pointer'>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <ClientSideFilters
                  filters={clientFilters}
                  onFiltersChange={onClientFiltersChange}
                />
              </div>
            </div>

            {/* Reset All Button */}
            {activeFiltersCount > 0 && (
              <div className='pt-2 border-t border-gray-200 dark:border-gray-700'>
                <Button
                  onClick={onResetAll}
                  variant='outline'
                  size='sm'
                  className='w-full h-8 text-xs cursor-pointer active:scale-95 transition-transform'
                >
                  <RotateCcw className='w-3 h-3 mr-1' />
                  全ての条件をリセット
                </Button>
              </div>
            )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Desktop Layout (2xl and above) */}
        <div className='hidden 2xl:flex gap-4 items-center'>
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
              className='h-7 text-xs cursor-pointer'
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
                  className='text-xs px-2 h-7 cursor-pointer'
                >
                  {region}
                </Button>
              ))}
            </div>

            <Select onValueChange={onPrefectureJump}>
              <SelectTrigger className='w-[120px] h-7 text-xs cursor-pointer'>
                <SelectValue placeholder='都道府県...' />
              </SelectTrigger>
              <SelectContent>
                {PrefectureOptions.map((prefecture) => (
                  <SelectItem key={prefecture} value={prefecture} className='cursor-pointer'>
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
              <InputGroup className='flex-1 max-w-xs'>
                <InputGroupAddon>
                  <Search className='h-4 w-4' />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder='キーワードで検索...'
                  value={searchTerm}
                  onChange={(e) => onSearchTermChange(e.target.value)}
                />
              </InputGroup>
              <Select value={typeFilter} onValueChange={onTypeFilterChange}>
                <SelectTrigger className='h-9 w-[180px] cursor-pointer'>
                  <SelectValue placeholder='全種別' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all' className='cursor-pointer'>全種別</SelectItem>
                  {Object.entries(CampingSpotTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key} className='cursor-pointer'>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className='ml-2'>
                <ClientSideFilters
                  filters={clientFilters}
                  onFiltersChange={onClientFiltersChange}
                />
              </div>
              {/* Reset All Button */}
              {activeFiltersCount > 0 && (
                <Button
                  onClick={onResetAll}
                  variant='outline'
                  size='sm'
                  className='h-8 text-xs cursor-pointer active:scale-95 transition-transform whitespace-nowrap'
                >
                  <RotateCcw className='w-3 h-3 mr-1' />
                  全てリセット
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
