'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { formatDistance } from '@/lib/formatDistance';
import { calculateBoundsFromZoomAndCenter } from '@/lib/maps';
import { useToast } from '@/components/ui/use-toast';
import { useMapBoundsLoader } from '@/hooks/useMapBoundsLoader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';

import { MapPin, Info, Plus } from 'lucide-react';
import {
  getPublicCampingSpotsByBounds,
  getPublicCampingSpotsWithPagination,
} from '../actions/campingSpots';
import {
  CampingSpotWithId,
  CampingSpotTypeLabels,
} from '@/data/schemas/campingSpot';
import {
  calculateSecurityLevel,
  calculateQuietnessLevel,
} from '@/lib/campingSpotUtils';
import {
  PREFECTURE_COORDINATES,
  REGION_COORDINATES,
} from '@/lib/prefectureCoordinates';
import ShachuHakuFilters from '@/components/shachu-haku/ShachuHakuFilters';
import { SpotsList } from '@/components/shachu-haku/SpotsList';
import { ClientSideFilterValues } from '@/components/shachu-haku/ClientSideFilters';
import {
  filterSpotsClientSide,
  hasActiveClientFilters,
} from '@/lib/clientSideFilterSpots';

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
  if (isFree) return 'bg-green-500 hover:bg-green-600'; // 無料：緑色
  if (!pricePerNight) return 'bg-gray-500 hover:bg-gray-600'; // 料金未設定：グレー
  if (pricePerNight <= 1000) return 'bg-yellow-500 hover:bg-yellow-600'; // 1000円以下：黄色
  if (pricePerNight <= 2000) return 'bg-orange-500 hover:bg-orange-600'; // 1001-2000円：オレンジ色
  return 'bg-red-500 hover:bg-red-600'; // 2001円以上：赤色
};

export default function ShachuHakuClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [spots, setSpots] = useState<CampingSpotWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpot, setSelectedSpot] = useState<CampingSpotWithId | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<'map' | 'list'>(() => {
    // URLパラメータからタブを決定
    const tabParam = searchParams.get('tab');
    return tabParam === 'list' ? 'list' : 'map';
  });
  const [searchTerm, setSearchTerm] = useState(() => {
    // URLパラメータから検索クエリを取得
    return searchParams.get('q') || '';
  });
  const [typeFilter, setTypeFilter] = useState(() => {
    // URLパラメータから種別フィルターを取得
    return searchParams.get('type') || 'all';
  });
  const [clientFilters, setClientFilters] = useState<ClientSideFilterValues>(
    () => {
      // URLパラメータからクライアント側フィルターを取得
      return {
        pricingFilter:
          (searchParams.get(
            'pricing'
          ) as ClientSideFilterValues['pricingFilter']) || 'all',
        minSecurityLevel: parseInt(searchParams.get('min_security') || '0'),
        minQuietnessLevel: parseInt(searchParams.get('min_quietness') || '0'),
        maxToiletDistance: searchParams.get('max_toilet_dist')
          ? parseInt(searchParams.get('max_toilet_dist')!)
          : null,
        minElevation: searchParams.get('min_elevation')
          ? parseInt(searchParams.get('min_elevation')!)
          : null,
        maxElevation: searchParams.get('max_elevation')
          ? parseInt(searchParams.get('max_elevation')!)
          : null,
      };
    }
  );

  // Map state for zoom and center
  const [mapZoom, setMapZoom] = useState(() => {
    const zoom = searchParams.get('zoom');
    return zoom ? parseFloat(zoom) : 9;
  });
  const [mapCenter, setMapCenter] = useState<[number, number]>(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    if (lat && lng) {
      return [parseFloat(lng), parseFloat(lat)];
    }
    return [139.6917, 35.6895]; // デフォルト: 東京
  });

  // Saved bounds from map (used for list view filtering)
  const [savedBounds, setSavedBounds] = useState<{
    north: number;
    south: number;
    east: number;
    west: number;
  } | null>(() => {
    // URLパラメータから境界を取得
    const north = searchParams.get('bounds_north');
    const south = searchParams.get('bounds_south');
    const east = searchParams.get('bounds_east');
    const west = searchParams.get('bounds_west');
    if (north && south && east && west) {
      return {
        north: parseFloat(north),
        south: parseFloat(south),
        east: parseFloat(east),
        west: parseFloat(west),
      };
    }
    return null;
  });

  // Pagination state for list view
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  // Promise key for triggering Suspense re-render
  const [listPromiseKey, setListPromiseKey] = useState(0);

  // Cache the promise to avoid creating new ones on every render
  const [cachedListPromise, setCachedListPromise] =
    useState<Promise<any> | null>(null);

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

  // Update URL when filters or map state change (skip initial mount)
  useEffect(() => {
    // Skip URL update on initial mount to preserve URL parameters
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

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
      params.set('max_toilet_dist', clientFilters.maxToiletDistance.toString());
    }
    if (clientFilters.minElevation !== null) {
      params.set('min_elevation', clientFilters.minElevation.toString());
    }
    if (clientFilters.maxElevation !== null) {
      params.set('max_elevation', clientFilters.maxElevation.toString());
    }

    // Add map zoom and center (for both map and list tabs to maintain filter state)
    params.set('zoom', mapZoom.toFixed(2));
    params.set('lat', mapCenter[1].toFixed(6));
    params.set('lng', mapCenter[0].toFixed(6));

    // Add bounds if available (for consistent filtering between map and list)
    if (savedBounds) {
      params.set('bounds_north', savedBounds.north.toFixed(6));
      params.set('bounds_south', savedBounds.south.toFixed(6));
      params.set('bounds_east', savedBounds.east.toFixed(6));
      params.set('bounds_west', savedBounds.west.toFixed(6));
    }

    // Update URL without reload
    const newUrl = params.toString()
      ? `/shachu-haku?${params.toString()}`
      : '/shachu-haku';
    router.replace(newUrl, { scroll: false });
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
  // Create and cache the promise
  useEffect(() => {
    if (activeTab === 'list') {
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
        bounds: bounds ? {
          north: bounds.north.toFixed(4),
          south: bounds.south.toFixed(4),
          east: bounds.east.toFixed(4),
          west: bounds.west.toFixed(4),
        } : null,
        page: currentPage,
      });

      // Skip if filters haven't changed
      if (lastListFiltersRef.current === filtersKey) {
        return;
      }

      lastListFiltersRef.current = filtersKey;

      // Create new promise and cache it
      const promise = getPublicCampingSpotsWithPagination(
        currentPage,
        pageSize,
        filters
      );
      setCachedListPromise(promise);
      setListPromiseKey((prev) => prev + 1);
    } else {
      // Reset when leaving list tab
      lastListFiltersRef.current = null;
    }
  }, [
    activeTab,
    currentPage,
    searchTerm,
    typeFilter,
    savedBounds,
    mapZoom,
    mapCenter,
  ]);

  // Reload map data when switching to map tab or when filters change
  useEffect(() => {
    const isTabChangedToMap = prevActiveTabRef.current !== 'map' && activeTab === 'map';
    prevActiveTabRef.current = activeTab;

    if (isTabChangedToMap) {
      // Tab just changed to map - initialize bounds if needed
      let bounds = mapBoundsRef.current;

      // If map hasn't initialized bounds yet, use savedBounds or calculate from zoom/center
      if (!bounds) {
        if (savedBoundsRef.current) {
          bounds = savedBoundsRef.current;
          mapBoundsRef.current = savedBoundsRef.current;
        } else if (mapZoomRef.current && mapCenterRef.current) {
          bounds = calculateBoundsFromZoomAndCenter(mapCenterRef.current, mapZoomRef.current);
          mapBoundsRef.current = bounds;
        }
      }

      // Trigger reload if we have bounds
      if (bounds) {
        handleBoundsChangeWrapper(bounds);
      }
    } else if (activeTab === 'map') {
      // Already on map tab, reload if filters changed
      reloadIfNeeded(mapBoundsRef.current);
    }
  }, [searchTerm, typeFilter, activeTab, handleBoundsChangeWrapper, reloadIfNeeded]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupMapBoundsLoader();
    };
  }, [cleanupMapBoundsLoader]);

  const handleSpotSelect = (spot: CampingSpotWithId) => {
    // マップからのスポットクリック時は何もしない（ポップアップのみ表示）
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
      setMapCenter([coords.lng, coords.lat]);
      setMapZoom(coords.zoom);
    }
  };

  // Handle region jump
  const handleRegionJump = (region: string) => {
    const coords = REGION_COORDINATES[region];
    if (coords) {
      setMapCenter([coords.lng, coords.lat]);
      setMapZoom(coords.zoom);
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
        setMapCenter([position.coords.longitude, position.coords.latitude]);
        setMapZoom(12);
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

  // Apply client-side filters to spots
  const filteredSpots = filterSpotsClientSide(spots, clientFilters);

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
            <Link href='/shachu-haku/submit'>
              <Button className='bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto'>
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
        />

        {/* Tab Navigation */}
        <div className='flex space-x-2 mb-6 border-b border-gray-200 dark:border-gray-700'>
          <Button
            variant={activeTab === 'map' ? 'default' : 'ghost'}
            onClick={() => handleTabChange('map')}
            className='rounded-b-none'
          >
            <MapPin className='w-4 h-4 mr-2' />
            地図表示
          </Button>
          <Button
            variant={activeTab === 'list' ? 'default' : 'ghost'}
            onClick={() => handleTabChange('list')}
            className='rounded-b-none'
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
              <CardTitle className='flex items-center gap-2'>
                <MapPin className='w-5 h-5' />
                {loading ? (
                  <span className='flex items-center gap-2'>
                    車中泊スポット地図 (読み込み中... <Spinner className='size-4' />)
                  </span>
                ) : (
                  `車中泊スポット地図 (${filteredSpots.length}件${
                    hasActiveClientFilters(clientFilters)
                      ? ` / ${spots.length}件中`
                      : ''
                  })`
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ShachuHakuMap
                spots={filteredSpots}
                onSpotSelect={handleSpotSelect}
                readonly={true}
                onBoundsChange={handleBoundsChangeWrapper}
                initialZoom={mapZoom}
                initialCenter={mapCenter}
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

            {/* List - use + Suspense */}
            {cachedListPromise ? (
              <>
                <Suspense
                  fallback={
                    <Card>
                      <CardHeader>
                        <CardTitle className='flex items-center gap-2'>
                          車中泊スポット一覧 (読み込み中... <Spinner className='size-4' />)
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
                  }
                  key={`list-${listPromiseKey}`}
                >
                  <SpotsList
                    spotsPromise={cachedListPromise}
                    onSpotSelect={handleListSpotSelect}
                    onNavigateToDetail={handleNavigateToSpotDetail}
                    onPageChange={setCurrentPage}
                    clientFilters={clientFilters}
                  />
                </Suspense>
              </>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    車中泊スポット一覧 (読み込み中... <Spinner className='size-4' />)
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
            )}
          </div>
        )}
      </div>

      {/* Selected Spot Detail Modal for List View */}
      {selectedSpot && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <Card className='w-full max-w-2xl max-h-[90vh] overflow-auto'>
            <CardHeader>
              <CardTitle className='flex justify-between items-center'>
                {selectedSpot.name}
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setSelectedSpot(null)}
                >
                  ✕
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div>
                  <h4 className='font-semibold'>基本情報</h4>
                  <p className='text-sm text-gray-600 dark:text-gray-300'>
                    {selectedSpot.address}
                  </p>
                  <div className='flex gap-2 mt-2'>
                    <Badge
                      className={`${getTypeColor(
                        selectedSpot.type
                      )} text-white`}
                    >
                      {CampingSpotTypeLabels[selectedSpot.type]}
                    </Badge>
                    <Badge
                      className={`${getPricingColor(
                        selectedSpot.pricing.isFree,
                        selectedSpot.pricing.pricePerNight
                      )} text-white`}
                    >
                      {selectedSpot.pricing.isFree
                        ? '無料'
                        : `¥${selectedSpot.pricing.pricePerNight || '未設定'}`}
                    </Badge>
                    <Badge
                      className={`${getRatingColor(
                        calculateSecurityLevel(selectedSpot)
                      )} text-white`}
                    >
                      治安 {calculateSecurityLevel(selectedSpot)}/5 🔒
                    </Badge>
                    <Badge
                      className={`${getRatingColor(
                        calculateQuietnessLevel(selectedSpot)
                      )} text-white`}
                    >
                      静けさ {calculateQuietnessLevel(selectedSpot)}/5 🔇
                    </Badge>
                  </div>
                </div>

                {selectedSpot.notes && (
                  <div>
                    <h4 className='font-semibold'>備考</h4>
                    <p className='text-sm text-gray-700 dark:text-gray-300'>
                      {selectedSpot.notes}
                    </p>
                  </div>
                )}

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                  {selectedSpot.distanceToToilet && (
                    <div>
                      トイレまで:{' '}
                      {formatDistance(selectedSpot.distanceToToilet)}
                    </div>
                  )}
                  {selectedSpot.distanceToBath && (
                    <div>
                      入浴施設まで:{' '}
                      {formatDistance(selectedSpot.distanceToBath)}
                    </div>
                  )}
                  {selectedSpot.distanceToConvenience && (
                    <div>
                      コンビニまで:{' '}
                      {formatDistance(selectedSpot.distanceToConvenience)}
                    </div>
                  )}
                  {selectedSpot.elevation && (
                    <div>標高: {selectedSpot.elevation}m</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
