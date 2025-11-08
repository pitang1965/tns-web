'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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

import { MapPin, Info, Plus, Share2 } from 'lucide-react';
import {
  getPublicCampingSpotsByBounds,
  getPublicCampingSpotsWithPagination,
} from '../actions/campingSpots';
import { handleCampingSpotShare } from '@/lib/shareUtils';
import { CampingSpotWithId } from '@/data/schemas/campingSpot';
import {
  PREFECTURE_COORDINATES,
  REGION_COORDINATES,
} from '@/lib/prefectureCoordinates';
import ShachuHakuFilters from '@/components/shachu-haku/ShachuHakuFilters';
import { SpotsList } from '@/components/shachu-haku/SpotsList';
import { filterSpotsClientSide } from '@/lib/clientSideFilterSpots';
import { getActiveFilterDescriptions } from '@/lib/filterDescriptions';
import { SpotPopup } from '@/components/shachu-haku/SpotPopup';

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
  const isInitialMountRef = useRef(true);
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

  // Track last URL to prevent unnecessary updates
  const lastUrlRef = useRef<string>('');
  const urlUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update URL when filters or map state change (skip initial mount)
  useEffect(() => {
    // Skip URL update on initial mount to preserve URL parameters
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    // Clear any pending URL update
    if (urlUpdateTimeoutRef.current) {
      clearTimeout(urlUpdateTimeoutRef.current);
    }

    // Debounce URL updates to prevent infinite loop
    urlUpdateTimeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams();

      // Add active tab if it's 'list'
      if (activeTab === 'list') {
        params.set('tab', 'list');
      }

      // Add search term
      if (searchTerm) {
        params.set('q', searchTerm);
      }

      // Add type filter
      if (typeFilter && typeFilter !== 'all') {
        params.set('type', typeFilter);
      }

      // Add client-side filters
      if (clientFilters.pricingFilter !== 'all') {
        params.set('pricing', clientFilters.pricingFilter);
      }
      if (clientFilters.minSecurityLevel > 0) {
        params.set('min_security', clientFilters.minSecurityLevel.toString());
      }
      if (clientFilters.minQuietnessLevel > 0) {
        params.set('min_quietness', clientFilters.minQuietnessLevel.toString());
      }
      if (clientFilters.maxToiletDistance !== null) {
        params.set(
          'max_toilet_dist',
          clientFilters.maxToiletDistance.toString()
        );
      }
      if (clientFilters.minElevation !== null) {
        params.set('min_elevation', clientFilters.minElevation.toString());
      }
      if (clientFilters.maxElevation !== null) {
        params.set('max_elevation', clientFilters.maxElevation.toString());
      }

      // Add center, lng_span, and aspect_ratio if bounds are available (for consistent display range across devices)
      if (savedBounds) {
        const centerLat = (savedBounds.north + savedBounds.south) / 2;
        const centerLng = (savedBounds.east + savedBounds.west) / 2;
        const latSpan = savedBounds.north - savedBounds.south;
        const lngSpan = savedBounds.east - savedBounds.west;
        const aspectRatio = lngSpan / latSpan; // aspect_ratio = lng_span / lat_span

        // Round to 7 decimal places (Google Maps standard)
        params.set('lat', centerLat.toFixed(7));
        params.set('lng', centerLng.toFixed(7));
        params.set('lng_span', lngSpan.toFixed(7));
        params.set('aspect_ratio', aspectRatio.toFixed(2)); // aspect_ratioは小数点2桁で十分
      } else {
        // Only add center if bounds are not available (fallback to zoom-based display)
        params.set('lat', mapCenter[1].toFixed(6));
        params.set('lng', mapCenter[0].toFixed(6));
        params.set('zoom', mapZoom.toFixed(2));
      }

      // Update URL without reload
      const newUrl = params.toString()
        ? `/shachu-haku?${params.toString()}`
        : '/shachu-haku';

      // Only update if URL actually changed (prevents infinite loop from floating point errors)
      if (newUrl !== lastUrlRef.current) {
        lastUrlRef.current = newUrl;
        router.replace(newUrl, { scroll: false });
      }
    }, 500); // 500ms debounce

    return () => {
      if (urlUpdateTimeoutRef.current) {
        clearTimeout(urlUpdateTimeoutRef.current);
      }
    };
  }, [
    searchTerm,
    typeFilter,
    clientFilters,
    activeTab,
    mapZoom,
    mapCenter,
    savedBounds,
    router,
  ]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, clientFilters]);

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
    setActiveTab(tab);
    // URL update is handled by useEffect
  };

  // Handle prefecture jump
  const handlePrefectureJump = (prefecture: string) => {
    const coords = PREFECTURE_COORDINATES[prefecture];
    if (coords) {
      const center: [number, number] = [coords.lng, coords.lat];

      // Calculate lat_span from lng_span and aspect_ratio
      const latSpan = coords.lng_span / coords.aspect_ratio;

      // Calculate bounds directly from center and span for consistent display across devices
      const bounds = {
        north: coords.lat + latSpan / 2,
        south: coords.lat - latSpan / 2,
        east: coords.lng + coords.lng_span / 2,
        west: coords.lng - coords.lng_span / 2,
      };

      setMapCenter(center);
      setMapZoom(9); // Default zoom, will be overridden by fitBounds
      setSavedBounds(bounds);
    }
  };

  // Handle region jump
  const handleRegionJump = (region: string) => {
    const coords = REGION_COORDINATES[region];
    if (coords) {
      const center: [number, number] = [coords.lng, coords.lat];

      // Calculate lat_span from lng_span and aspect_ratio
      const latSpan = coords.lng_span / coords.aspect_ratio;

      // Calculate bounds directly from center and span for consistent display across devices
      const bounds = {
        north: coords.lat + latSpan / 2,
        south: coords.lat - latSpan / 2,
        east: coords.lng + coords.lng_span / 2,
        west: coords.lng - coords.lng_span / 2,
      };

      setMapCenter(center);
      setMapZoom(9); // Default zoom, will be overridden by fitBounds
      setSavedBounds(bounds);
    }
  };

  // Handle current location jump
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'エラー',
        description: 'お使いのブラウザは位置情報取得に対応していません',
        variant: 'destructive',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const center: [number, number] = [
          position.coords.longitude,
          position.coords.latitude,
        ];
        const zoom = 12;

        // Calculate bounds from center and zoom for consistent display across devices
        const bounds = calculateBoundsFromZoomAndCenter(center, zoom);

        setMapCenter(center);
        setMapZoom(zoom);
        setSavedBounds(bounds);

        toast({
          title: '成功',
          description: '現在地に移動しました',
        });
      },
      (error) => {
        toast({
          title: 'エラー',
          description:
            '位置情報の取得に失敗しました。ブラウザの設定を確認してください。',
          variant: 'destructive',
        });
        console.error('Geolocation error:', error);
      }
    );
  };

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

  // Apply client-side filters to spots
  const filteredSpots = filterSpotsClientSide(spots, clientFilters);

  // Filter spots within visible bounds
  const visibleSpots = useMemo(() => {
    if (!savedBounds) return filteredSpots;

    return filteredSpots.filter((spot) => {
      const lat = spot.coordinates[1];
      const lng = spot.coordinates[0];
      return (
        lat <= savedBounds.north &&
        lat >= savedBounds.south &&
        lng <= savedBounds.east &&
        lng >= savedBounds.west
      );
    });
  }, [filteredSpots, savedBounds]);

  // Generate active filter descriptions for display
  const activeFilterDescriptions = useMemo(
    () => getActiveFilterDescriptions(searchTerm, typeFilter, clientFilters),
    [searchTerm, typeFilter, clientFilters]
  );

  return (
    <div className='container mx-auto p-6 space-y-6'>
      <div className='space-y-4'>
        <div className='flex flex-col md:flex-row md:justify-between md:items-center gap-4'>
          <div>
            <h1 className='text-3xl font-bold'>車中泊スポット</h1>
            <div className='text-sm text-gray-600 dark:text-gray-300 mt-1'>
              ログイン不要で車中泊スポットを検索・閲覧できます
            </div>
          </div>
          <div className='flex flex-col sm:flex-row gap-2'>
            <Button
              onClick={handleShare}
              variant='outline'
              className='w-full sm:w-auto cursor-pointer'
            >
              <Share2 className='w-4 h-4 mr-2' />
              車中泊情報を共有
            </Button>
            <Link href='/shachu-haku/submit'>
              <Button className='bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto cursor-pointer'>
                <Plus className='w-4 h-4 mr-2' />
                スポット投稿
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className='w-full'>
        <ShachuHakuFilters
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          onPrefectureJump={handlePrefectureJump}
          onRegionJump={handleRegionJump}
          onCurrentLocation={handleCurrentLocation}
          clientFilters={clientFilters}
          onClientFiltersChange={setClientFilters}
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
            <CardHeader>
              {/* カスタムポップアップ - マップ表示時に選択されたスポット情報を表示 */}
              {activeTab === 'map' && selectedSpot ? (
                <SpotPopup
                  spot={selectedSpot}
                  onClose={() => setSelectedSpot(null)}
                  actionButton={
                    <Button
                      onClick={() =>
                        handleNavigateToSpotDetail(selectedSpot._id)
                      }
                      className='bg-blue-600 hover:bg-blue-700 text-white cursor-pointer px-3 py-1 shrink-0'
                      size='sm'
                    >
                      もっと見る
                    </Button>
                  }
                />
              ) : (
                <>
                  <CardTitle className='flex items-center gap-2'>
                    <MapPin className='w-5 h-5' />
                    {loading ? (
                      <span className='flex items-center gap-2'>
                        読み込み中... <Spinner className='size-4' />
                      </span>
                    ) : (
                      `表示範囲内: ${visibleSpots.length}件`
                    )}
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
            <CardContent>
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
              />
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
                    <Info className='w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5' />
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
              <SpotsList
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
