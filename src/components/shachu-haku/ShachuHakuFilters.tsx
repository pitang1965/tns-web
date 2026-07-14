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
import { Input } from '@/components/ui/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  MapPin,
  Search,
  Navigation,
  Filter,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  X,
} from 'lucide-react';
import { PrefectureOptions } from '@/data/schemas/campingSpot';
import { SpotTypeFilter } from './SpotTypeFilter';
import { REGION_COORDINATES } from '@/lib/prefectureCoordinates';
import ClientSideFilters, { ClientSideFilterValues } from './ClientSideFilters';
import { useExplicitSearch } from '@/hooks/useExplicitSearch';
import { capture } from '@/lib/analytics';

type ShachuHakuFiltersProps = {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  typeFilter: string[];
  onTypeFilterChange: (value: string[]) => void;
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

  const quickFilters = [
    {
      label: '無料',
      isActive: clientFilters.pricingFilter === 'free',
      onToggle: () =>
        onClientFiltersChange({
          ...clientFilters,
          pricingFilter:
            clientFilters.pricingFilter === 'free' ? 'all' : 'free',
        }),
    },
    {
      label: '治安★4以上',
      isActive: clientFilters.minSecurityLevel >= 4,
      onToggle: () =>
        onClientFiltersChange({
          ...clientFilters,
          minSecurityLevel: clientFilters.minSecurityLevel >= 4 ? 0 : 4,
        }),
    },
    {
      label: '静か★4以上',
      isActive: clientFilters.minQuietnessLevel >= 4,
      onToggle: () =>
        onClientFiltersChange({
          ...clientFilters,
          minQuietnessLevel: clientFilters.minQuietnessLevel >= 4 ? 0 : 4,
        }),
    },
    {
      label: 'トイレ200m以内',
      isActive:
        clientFilters.maxToiletDistance !== null &&
        clientFilters.maxToiletDistance <= 200,
      onToggle: () =>
        onClientFiltersChange({
          ...clientFilters,
          maxToiletDistance:
            clientFilters.maxToiletDistance !== null &&
            clientFilters.maxToiletDistance <= 200
              ? null
              : 200,
        }),
    },
    {
      label: 'コンビニ200m以内',
      isActive:
        clientFilters.maxConvenienceDistance !== null &&
        clientFilters.maxConvenienceDistance <= 200,
      onToggle: () =>
        onClientFiltersChange({
          ...clientFilters,
          maxConvenienceDistance:
            clientFilters.maxConvenienceDistance !== null &&
            clientFilters.maxConvenienceDistance <= 200
              ? null
              : 200,
        }),
    },
    {
      label: '入浴施設200m以内',
      isActive:
        clientFilters.maxBathDistance !== null &&
        clientFilters.maxBathDistance <= 200,
      onToggle: () =>
        onClientFiltersChange({
          ...clientFilters,
          maxBathDistance:
            clientFilters.maxBathDistance !== null &&
            clientFilters.maxBathDistance <= 200
              ? null
              : 200,
        }),
    },
  ];

  const {
    inputValue,
    setInputValue,
    inputRef,
    submit: handleSearchSubmit,
    clear: handleSearchClear,
    isDirty: isSearchDirty,
  } = useExplicitSearch(searchTerm, onSearchTermChange);

  // 検索の確定（Enter / ボタン）で計測する。クリアや未変更の再送信では送らない。
  const handleSearchSubmitWithTracking = () => {
    const trimmed = inputValue.trim();
    if (trimmed && isSearchDirty) {
      capture('spot_search', { query: trimmed, source: 'filter' });
    }
    handleSearchSubmit();
  };

  const handleSearchKeyDownWithTracking = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmitWithTracking();
    }
  };

  // Count active filters
  const countActiveFilters = () => {
    let count = 0;
    if (searchTerm) count++;
    if (typeFilter.length > 0) count++;
    if (clientFilters.pricingFilter !== 'all') count++;
    if (clientFilters.minSecurityLevel > 0) count++;
    if (clientFilters.minQuietnessLevel > 0) count++;
    if (clientFilters.maxToiletDistance !== null) count++;
    if (clientFilters.maxConvenienceDistance !== null) count++;
    if (clientFilters.maxBathDistance !== null) count++;
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
    <Card className="mb-4 border-0 shadow-none rounded-none sm:border sm:shadow-xs sm:rounded-lg">
      <CardContent className="px-3 py-4 sm:px-6">
        {/* Mobile Layout */}
        <Collapsible
          open={isOpen}
          onOpenChange={setIsOpen}
          className="block 2xl:hidden"
        >
          {/* Trigger Button (+ inline reset when filters active) */}
          <div className="flex items-center gap-2 mb-3">
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="flex-1 justify-between h-10">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    表示範囲・絞り込み設定
                  </span>
                  {activeFiltersCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-500 text-white">
                      {activeFiltersCount}
                    </span>
                  )}
                </div>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            {activeFiltersCount > 0 && (
              <Button
                onClick={onResetAll}
                variant="outline"
                className="h-10 px-3 text-xs cursor-pointer shrink-0 active:scale-95 transition-transform"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                リセット
              </Button>
            )}
          </div>

          {/* Quick Filter Chips - always visible on mobile */}
          <div className="flex flex-wrap gap-1 mb-2">
            {quickFilters.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={chip.onToggle}
                className={`flex-shrink-0 h-7 px-2.5 text-xs rounded-full border cursor-pointer transition-colors ${
                  chip.isActive
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-background text-foreground border-input hover:bg-accent'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Collapsible Content */}
          <CollapsibleContent>
            <div className="space-y-3" suppressHydrationWarning>
              {/* Location Jump */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    表示範囲:
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 items-center">
                  <Button
                    onClick={handleCurrentLocation}
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs cursor-pointer"
                  >
                    <Navigation className="w-3 h-3 mr-1" />
                    現在地
                  </Button>

                  {Object.keys(REGION_COORDINATES).map((region) => (
                    <Button
                      key={region}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRegionJump(region)}
                      className="text-xs px-2 h-7 cursor-pointer"
                    >
                      {region}
                    </Button>
                  ))}

                  <Select onValueChange={handlePrefectureJump}>
                    <SelectTrigger className="w-[120px] h-7 text-xs cursor-pointer">
                      <SelectValue placeholder="都道府県..." />
                    </SelectTrigger>
                    <SelectContent>
                      {PrefectureOptions.map((prefecture) => (
                        <SelectItem
                          key={prefecture}
                          value={prefecture}
                          className="cursor-pointer"
                        >
                          {prefecture}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Search and Type Filter */}
              <div className="flex flex-col md:flex-row gap-2 items-start md:items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    絞り込み:
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 flex-1">
                  <div className="flex gap-1 flex-1">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        ref={inputRef}
                        placeholder="キーワードで絞り込み..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleSearchKeyDownWithTracking}
                        className={`pl-9 h-9 ${inputValue ? 'pr-8' : ''}`}
                      />
                      {inputValue && (
                        <button
                          type="button"
                          onClick={handleSearchClear}
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center cursor-pointer"
                        >
                          <X className="h-3 w-3 text-white" />
                        </button>
                      )}
                    </div>
                    <Button
                      onClick={handleSearchSubmitWithTracking}
                      size="sm"
                      className="h-9 px-3 cursor-pointer"
                      disabled={!isSearchDirty}
                    >
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <SpotTypeFilter
                      value={typeFilter}
                      onChange={onTypeFilterChange}
                      className="flex-1 sm:flex-none sm:w-[220px]"
                    />
                    <ClientSideFilters
                      filters={clientFilters}
                      onFiltersChange={onClientFiltersChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Desktop Layout (2xl and above) */}
        <div className="hidden 2xl:flex 2xl:flex-col gap-3">
          {/* Location Jump */}
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              表示範囲:
            </span>

            <Button
              onClick={onCurrentLocation}
              size="sm"
              variant="outline"
              className="h-7 text-xs cursor-pointer"
            >
              <Navigation className="w-3 h-3 mr-1" />
              現在地
            </Button>

            <div className="flex items-center gap-1">
              {Object.keys(REGION_COORDINATES).map((region) => (
                <Button
                  key={region}
                  variant="ghost"
                  size="sm"
                  onClick={() => onRegionJump(region)}
                  className="text-xs px-2 h-7 cursor-pointer"
                >
                  {region}
                </Button>
              ))}
            </div>

            <Select onValueChange={onPrefectureJump}>
              <SelectTrigger className="w-[120px] h-7 text-xs cursor-pointer">
                <SelectValue placeholder="都道府県..." />
              </SelectTrigger>
              <SelectContent>
                {PrefectureOptions.map((prefecture) => (
                  <SelectItem
                    key={prefecture}
                    value={prefecture}
                    className="cursor-pointer"
                  >
                    {prefecture}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search, Type Filter and Quick Filter Chips - single row */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              絞り込み:
            </span>
            {activeFiltersCount > 0 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500 text-white">
                {activeFiltersCount}
              </span>
            )}
            <div className="flex gap-1 w-64">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="キーワードで絞り込み..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleSearchKeyDownWithTracking}
                  className={`pl-9 h-9 ${inputValue ? 'pr-8' : ''}`}
                />
                {inputValue && (
                  <button
                    type="button"
                    onClick={handleSearchClear}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center cursor-pointer"
                  >
                    <X className="h-3 w-3 text-white" />
                  </button>
                )}
              </div>
              <Button
                onClick={handleSearchSubmitWithTracking}
                size="sm"
                className="h-9 px-3 cursor-pointer"
                disabled={inputValue.trim() === searchTerm}
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
            <SpotTypeFilter
              value={typeFilter}
              onChange={onTypeFilterChange}
              className="w-[200px]"
            />
            <ClientSideFilters
              filters={clientFilters}
              onFiltersChange={onClientFiltersChange}
            />

            {/* Divider between search controls and quick chips */}
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

            {/* Quick Filter Chips */}
            {quickFilters.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={chip.onToggle}
                className={`flex-shrink-0 h-7 px-3 text-xs rounded-full border cursor-pointer transition-colors ${
                  chip.isActive
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-background text-foreground border-input hover:bg-accent'
                }`}
              >
                {chip.label}
              </button>
            ))}

            {/* Reset All Button */}
            {activeFiltersCount > 0 && (
              <Button
                onClick={onResetAll}
                variant="outline"
                size="sm"
                className="h-8 text-xs cursor-pointer active:scale-95 transition-transform whitespace-nowrap ml-auto"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                全てリセット
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
