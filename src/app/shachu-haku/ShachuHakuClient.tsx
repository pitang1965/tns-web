'use client';

import { useState, useEffect, useCallback, useRef, useMemo, startTransition } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { calculateBoundsFromZoomAndCenter } from '@/lib/maps';
import { useToast } from '@/components/ui/use-toast';
import { useMapBoundsLoader } from '@/hooks/useMapBoundsLoader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useShachuHakuFilters } from '@/hooks/useShachuHakuFilters';
import { useLocationNavigation } from '@/hooks/useLocationNavigation';
import { useSpotFiltering } from '@/hooks/useSpotFiltering';
import { useOrientation } from '@/hooks/useOrientation';
import { useUrlSync } from '@/hooks/useUrlSync';

import { MapPin, Info, Plus, Share2, Sparkles } from 'lucide-react';
import {
  getPublicCampingSpotsByBounds,
  getPublicCampingSpotsWithPagination,
} from '../actions/campingSpots/public';
import { handleCampingSpotShare } from '@/lib/shareUtils';
import { CampingSpotWithId } from '@/data/schemas/campingSpot';
import ShachuHakuFilters from '@/components/shachu-haku/ShachuHakuFilters';
import { ShachuHakuSpotsList } from '@/components/shachu-haku/ShachuHakuSpotsList';
import { SpotPopup } from '@/components/shachu-haku/SpotPopup';
import { AdLink } from '@/components/shachu-haku/AdLink';

// Dynamically import the map component to avoid SSR issues
const ShachuHakuMap = dynamic(
  () => import('@/components/shachu-haku/ShachuHakuMap'),
  {
    ssr: false,
    loading: () => (
      <div className='h-[600px] bg-gray-100 animate-pulse rounded-lg' />
    ),
  }
);

export default function ShachuHakuClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Use custom hook for filter persistence
  const {
    searchTerm,
    setSearchTerm,
    typeFilter,
    setTypeFilter,
    clientFilters,
    setClientFilters,
    activeTab,
    setActiveTab,
    mapZoom,
    setMapZoom,
    mapCenter,
    setMapCenter,
    savedBounds,
    setSavedBounds,
    handleResetAll: handleResetAllFromHook,
  } = useShachuHakuFilters({
    searchParams,
    onResetComplete: () => {
      toast({
        title: '条件をリセットしました',
        description: '全ての表示条件がリセットされました',
      });
    },
  });

  const [spots, setSpots] = useState<CampingSpotWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpot, setSelectedSpot] = useState<CampingSpotWithId | null>(
    null
  );

  // Use orientation hook
  const { isLandscape } = useOrientation();

  // Pagination state for list view
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  // List view data and loading state
  const [listData, setListData] = useState<{
    spots: CampingSpotWithId[];
    total: number;
    page: number;
    totalPages: number;
  } | null>(null);
  const [listLoading, setListLoading] = useState(false);

  // Bounds state for map view - use ref instead of state to prevent re-renders
  const mapBoundsRef = useRef<{
    north: number;
    south: number;
    east: number;
    west: number;
  } | null>(null);
  const lastListFiltersRef = useRef<string | null>(null);
  const prevActiveTabRef = useRef<'map' | 'list'>(activeTab);

  // Refs for accessing current values without triggering re-renders
  const savedBoundsRef = useRef(savedBounds);
  savedBoundsRef.current = savedBounds;
  const mapZoomRef = useRef(mapZoom);
  mapZoomRef.current = mapZoom;
  const mapCenterRef = useRef(mapCenter);
  mapCenterRef.current = mapCenter;

  // Use custom hook for map bounds loading with optimized data fetching
  const {
    handleBoundsChange,
    cleanup: cleanupMapBoundsLoader,
    reloadIfNeeded,
    initialLoadDoneRef,
  } = useMapBoundsLoader({
    loadSpots: getPublicCampingSpotsByBounds,
    setLoading,
    setSpots,
    toast,
    filters: {
      searchTerm,
      prefectureFilter: 'all',
      typeFilter,
    },
  });

  // Load spots for list view with pagination - NO dependencies
  const loadListSpotsRef = useRef<
    | ((
        page: number,
        filters?: {
          searchTerm?: string;
          prefecture?: string;
          type?: string;
          bounds?: { north: number; south: number; east: number; west: number };
        }
      ) => Promise<void>)
    | null
  >(null);
  loadListSpotsRef.current = async (
    page: number,
    filters?: {
      searchTerm?: string;
      prefecture?: string;
      type?: string;
      bounds?: { north: number; south: number; east: number; west: number };
    }
  ) => {
    try {
      setLoading(true);
      const result = await getPublicCampingSpotsWithPagination(
        page,
        pageSize,
        filters
      );
      setSpots(result.spots);
      setTotalPages(result.totalPages);
      setTotalCount(result.total);
      setCurrentPage(result.page);
    } catch (error) {
      toast({
        title: 'エラー',
        description: '車中泊スポットの読み込みに失敗しました',
        variant: 'destructive',
      });
      console.error('Error loading spots:', error);
    } finally {
      setLoading(false);
    }
  };

  // Wrapper for handleBoundsChange that also saves bounds for list view
  const handleBoundsChangeWrapper = useCallback(
    (bounds: { north: number; south: number; east: number; west: number }) => {
      mapBoundsRef.current = bounds;
      setSavedBounds(bounds); // Save bounds for list view
      handleBoundsChange(bounds); // Call hook's handler
    },
    [handleBoundsChange]
  );

  // Sync URL with filters and map state
  useUrlSync({
    params: {
      tab: activeTab === 'list' ? 'list' : null,
      q: searchTerm || null,
      type: typeFilter !== 'all' ? typeFilter : null,
      pricing: clientFilters.pricingFilter !== 'all' ? clientFilters.pricingFilter : null,
      min_security: clientFilters.minSecurityLevel > 0 ? clientFilters.minSecurityLevel : null,
      min_quietness: clientFilters.minQuietnessLevel > 0 ? clientFilters.minQuietnessLevel : null,
      max_toilet_dist: clientFilters.maxToiletDistance !== null ? clientFilters.maxToiletDistance : null,
      min_elevation: clientFilters.minElevation !== null ? clientFilters.minElevation : null,
      max_elevation: clientFilters.maxElevation !== null ? clientFilters.maxElevation : null,
      lat: savedBounds
        ? ((savedBounds.north + savedBounds.south) / 2).toFixed(7)
        : mapCenter[1].toFixed(6),
      lng: savedBounds
        ? ((savedBounds.east + savedBounds.west) / 2).toFixed(7)
        : mapCenter[0].toFixed(6),
      lng_span: savedBounds
        ? (savedBounds.east - savedBounds.west).toFixed(7)
        : null,
      aspect_ratio: savedBounds
        ? ((savedBounds.east - savedBounds.west) / (savedBounds.north - savedBounds.south)).toFixed(2)
        : null,
      zoom: !savedBounds ? mapZoom.toFixed(2) : null,
    },
    basePath: '/shachu-haku',
    debounceMs: 500,
    enableDuplicateCheck: true,
  });


  // Load spots for list view when tab, filters, or page changes
  useEffect(() => {
    if (activeTab === 'list') {
      // Check if data is already loaded from map view
      const isDataAlreadyLoaded =
        spots.length > 0 && initialLoadDoneRef.current;
      // Check if this is first time switching to list view
      const isFirstListView = lastListFiltersRef.current === null;

      // Use savedBounds if available (from map), otherwise calculate from zoom and center
      let bounds:
        | { north: number; south: number; east: number; west: number }
        | undefined;
      if (savedBounds) {
        bounds = savedBounds;
      } else if (mapZoom && mapCenter) {
        bounds = calculateBoundsFromZoomAndCenter(mapCenter, mapZoom);
      }

      const filters = {
        searchTerm: searchTerm || undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        bounds,
      };

      // Create a stable string representation of filters for comparison
      const filtersKey = JSON.stringify({
        searchTerm: filters.searchTerm,
        type: filters.type,
        bounds: bounds
          ? {
              north: bounds.north.toFixed(4),
              south: bounds.south.toFixed(4),
              east: bounds.east.toFixed(4),
              west: bounds.west.toFixed(4),
            }
          : null,
        page: currentPage,
      });

      // Skip if we already initiated a request with the same filters (prevents multiple API calls during loading)
      if (lastListFiltersRef.current === filtersKey) {
        return;
      }

      // If first time switching to list view and data is already loaded from map,
      // use existing data immediately without loading
      if (isFirstListView && isDataAlreadyLoaded && currentPage === 1) {
        lastListFiltersRef.current = filtersKey;
        setListData({
          spots: spots,
          total: spots.length,
          page: 1,
          totalPages: Math.ceil(spots.length / pageSize),
        });
        return;
      }

      // Load data from API
      lastListFiltersRef.current = filtersKey;
      setListLoading(true);

      getPublicCampingSpotsWithPagination(currentPage, pageSize, filters)
        .then((data) => {
          setListData(data);
          setListLoading(false);
        })
        .catch((error) => {
          console.error('[Public] Error loading list data:', error);
          toast({
            title: 'エラー',
            description: '車中泊スポットの読み込みに失敗しました',
            variant: 'destructive',
          });
          setListLoading(false);
        });
    }
  }, [
    activeTab,
    currentPage,
    searchTerm,
    typeFilter,
    savedBounds,
    mapZoom,
    mapCenter,
    spots,
    spots.length,
    initialLoadDoneRef,
    pageSize,
    toast,
  ]);

  // Reload map data when switching to map tab or when filters change
  useEffect(() => {
    const isTabChangedToMap =
      prevActiveTabRef.current !== 'map' && activeTab === 'map';
    prevActiveTabRef.current = activeTab;

    if (isTabChangedToMap) {
      // Tab just changed to map - map component will initialize itself
      // and call handleBoundsChange automatically, so do nothing here
    } else if (activeTab === 'map') {
      // Already on map tab, reload if filters changed
      reloadIfNeeded(mapBoundsRef.current);
    }
  }, [searchTerm, typeFilter, activeTab, reloadIfNeeded]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupMapBoundsLoader();
    };
  }, [cleanupMapBoundsLoader]);

  const handleSpotSelect = (spot: CampingSpotWithId) => {
    // マップからのスポットクリック時にカスタムポップアップを表示
    setSelectedSpot(spot);
  };

  const handleListSpotSelect = (spot: CampingSpotWithId) => {
    // 一覧からのスポット選択時はダイアログを表示
    setSelectedSpot(spot);
  };

  const handleNavigateToSpotDetail = (spotId: string) => {
    // 個別ページに遷移（一覧表示からの遷移を示すパラメータを追加）
    router.push(`/shachu-haku/${spotId}?from=list`);
  };

  const handleTabChange = (tab: 'map' | 'list') => {
    startTransition(() => {
      setActiveTab(tab);
      // URL update is handled by useEffect
    });
  };

  // Use location navigation hook
  const { handlePrefectureJump, handleRegionJump, handleCurrentLocation } =
    useLocationNavigation({
      setMapCenter,
      setMapZoom,
      setSavedBounds,
      toast,
    });

  // Handle share
  const handleShare = async () => {
    const success = await handleCampingSpotShare({
      searchTerm,
      typeFilter,
      tab: activeTab,
      zoom: mapZoom,
      center: mapCenter,
      bounds: savedBounds,
      clientFilters,
    });

    if (success) {
      toast({
        title: '共有しました',
        description: '車中泊スポット情報を共有しました',
      });
    } else {
      toast({
        title: 'エラー',
        description: '共有に失敗しました',
        variant: 'destructive',
      });
    }
  };

  // Use spot filtering hook
  const { filteredSpots, visibleSpots, activeFilterDescriptions } =
    useSpotFiltering({
      spots,
      clientFilters,
      savedBounds,
      searchTerm,
      typeFilter,
    });

  // Render spot popup (shared between portrait and landscape)
  const spotPopup = useMemo(() => {
    if (!selectedSpot) return null;

    return (
      <SpotPopup
        spot={selectedSpot}
        onClose={() => setSelectedSpot(null)}
        actionButton={
          <Button
            onClick={() => handleNavigateToSpotDetail(selectedSpot._id)}
            className='bg-blue-600 hover:bg-blue-700 text-white cursor-pointer px-3 py-1 shrink-0'
            size='sm'
          >
            もっと見る
          </Button>
        }
        className={isLandscape ? 'h-full' : 'max-h-[60vh]'}
      />
    );
  }, [selectedSpot, isLandscape]);

  return (
    <div className='container mx-auto p-2 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6'>
      <div className='space-y-3 sm:space-y-4'>
        <div className='flex flex-col md:flex-row md:justify-between md:items-center gap-4'>
          <div>
            <h1 className='text-3xl font-bold'>車中泊スポット</h1>
            <div className='text-sm text-gray-600 dark:text-gray-300 mt-1'>
              ログイン不要で車中泊スポットを検索・閲覧できます
            </div>
          </div>
          <div className='flex flex-col sm:flex-row gap-2'>
            <Link href='/shachu-haku/shindan'>
              <Button
                variant='outline'
                className='w-full sm:w-auto cursor-pointer whitespace-nowrap border-pink-500 text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950'
              >
                <Sparkles className='w-4 h-4' />
                スポット診断
              </Button>
            </Link>
            <Button
              onClick={handleShare}
              variant='outline'
              className='w-full sm:w-auto cursor-pointer whitespace-nowrap'
            >
              <Share2 className='w-4 h-4' />
              車中泊情報を共有
            </Button>
            <Link href='/shachu-haku/submit'>
              <Button className='bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto cursor-pointer whitespace-nowrap'>
                <Plus className='w-4 h-4' />
                スポット投稿
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className='w-full'>
        <ShachuHakuFilters
          searchTerm={searchTerm}
          onSearchTermChange={(v) => { setSearchTerm(v); setCurrentPage(1); }}
          typeFilter={typeFilter}
          onTypeFilterChange={(v) => { setTypeFilter(v); setCurrentPage(1); }}
          onPrefectureJump={handlePrefectureJump}
          onRegionJump={handleRegionJump}
          onCurrentLocation={handleCurrentLocation}
          clientFilters={clientFilters}
          onClientFiltersChange={(v) => { setClientFilters(v); setCurrentPage(1); }}
          onResetAll={handleResetAllFromHook}
        />

        {/* Tab Navigation */}
        <div className='flex space-x-2 mb-6 border-b border-gray-200 dark:border-gray-700'>
          <Button
            variant={activeTab === 'map' ? 'default' : 'ghost'}
            onClick={() => handleTabChange('map')}
            className='rounded-b-none cursor-pointer'
          >
            <MapPin className='w-4 h-4 mr-2' />
            地図表示
          </Button>
          <Button
            variant={activeTab === 'list' ? 'default' : 'ghost'}
            onClick={() => handleTabChange('list')}
            className='rounded-b-none cursor-pointer'
          >
            一覧表示
          </Button>
        </div>

        {/* Map Tab Content - Always render but hide with visibility */}
        <div
          className='space-y-4'
          style={{
            visibility: activeTab === 'map' ? 'visible' : 'hidden',
            height: activeTab === 'map' ? 'auto' : '0',
            overflow: 'hidden',
          }}
        >
          <Card>
            <CardHeader className='px-3! pt-1.5! pb-0! sm:px-6! sm:pt-6! sm:pb-3! space-y-0'>
              {/* カスタムポップアップ - ポートレート時はヘッダーに表示 */}
              {activeTab === 'map' && selectedSpot && !isLandscape ? (
                spotPopup
              ) : (
                <>
                  <CardTitle className='flex items-center justify-between gap-2 text-base sm:text-lg md:text-xl mb-0'>
                    <div className='flex items-center gap-2'>
                      <MapPin className='w-4 h-4 sm:w-5 sm:h-5' />
                      {loading ? (
                        <span className='flex items-center gap-2'>
                          読み込み中... <Spinner className='size-4' />
                        </span>
                      ) : (
                        `表示範囲内: ${visibleSpots.length}件`
                      )}
                    </div>
                    <AdLink href="https://amzn.to/4oy6Dbc" label="ポータブル電源セール" shortLabel="ポタ電セール" />
                  </CardTitle>
                  {!loading && activeFilterDescriptions.length > 0 && (
                    <div className='text-sm text-muted-foreground space-y-1 mt-2'>
                      {activeFilterDescriptions.map((desc, index) => (
                        <div key={index}>{desc}</div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardHeader>
            <CardContent className='px-3! pt-2! pb-3! sm:px-6! sm:pt-3! sm:pb-6!'>
              {/* ランドスケープ時は地図とポップアップを横並びに */}
              <div className={isLandscape ? 'flex gap-2 sm:gap-4 items-stretch' : ''}>
                <div className={isLandscape ? 'flex-1 min-w-0' : ''}>
                  <ShachuHakuMap
                    spots={filteredSpots}
                    onSpotSelect={handleSpotSelect}
                    readonly={true}
                    onBoundsChange={handleBoundsChangeWrapper}
                    initialZoom={mapZoom}
                    initialCenter={mapCenter}
                    initialBounds={savedBounds || undefined}
                    onZoomChange={setMapZoom}
                    onCenterChange={setMapCenter}
                    isLandscape={isLandscape}
                  />
                </div>
                {/* ランドスケープ時はポップアップを右側に表示 */}
                {activeTab === 'map' && selectedSpot && isLandscape && (
                  <div className='w-64 sm:w-80 shrink-0 flex flex-col'>
                    <div className='flex-1'>{spotPopup}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* List Tab Content */}
        {activeTab === 'list' && (
          <div className='space-y-4'>
            {/* Filter Notice */}
            {savedBounds && (
              <Card className='bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'>
                <CardContent className='pt-4 pb-4'>
                  <div className='flex items-start gap-2'>
                    <Info className='w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5' />
                    <div className='text-sm text-blue-800 dark:text-blue-200'>
                      <strong>地図表示の範囲内</strong>
                      のスポットを表示しています。より広い範囲のスポットを表示するには、地図表示でズームアウトしてから一覧表示に切り替えてください。
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* List - loading state pattern */}
            {listLoading || !listData ? (
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    車中泊スポット一覧 (読み込み中...{' '}
                    <Spinner className='size-4' />)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className='border rounded-lg p-4'>
                        <div className='h-6 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-1/4 mb-2'></div>
                        <div className='h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-1/2 mb-3'></div>
                        <div className='flex gap-2'>
                          <div className='h-6 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-20'></div>
                          <div className='h-6 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-16'></div>
                          <div className='h-6 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-20'></div>
                          <div className='h-6 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-20'></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <ShachuHakuSpotsList
                spots={listData.spots}
                total={listData.total}
                page={listData.page}
                totalPages={listData.totalPages}
                onSpotSelect={handleListSpotSelect}
                onNavigateToDetail={handleNavigateToSpotDetail}
                onPageChange={setCurrentPage}
                clientFilters={clientFilters}
                searchTerm={searchTerm}
                typeFilter={typeFilter}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
