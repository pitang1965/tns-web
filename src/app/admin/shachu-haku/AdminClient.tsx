'use client';

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  Suspense,
  useReducer,
} from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useToast } from '@/components/ui/use-toast';
import { useMapBoundsLoader } from '@/hooks/useMapBoundsLoader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Download, MapPin, Plus, Users } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import Link from 'next/link';
import {
  getCampingSpotsByBounds,
  getCampingSpotsWithPagination,
} from '../../actions/campingSpots';
import {
  CampingSpotWithId,
  CampingSpotTypeLabels,
  PrefectureOptions,
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
import { AdminSpotsList } from '@/components/admin/AdminSpotsList';
import { ClientSideFilterValues } from '@/components/shachu-haku/ClientSideFilters';
import {
  filterSpotsClientSide,
  hasActiveClientFilters,
} from '@/lib/clientSideFilterSpots';

// Dynamically import the map component to avoid SSR issues
const ShachuHakuMap = dynamic(
  () => import('@/components/admin/ShachuHakuMap'),
  {
    ssr: false,
    loading: () => (
      <div className='h-[600px] bg-gray-100 animate-pulse rounded-lg' />
    ),
  }
);

const CSVImportDialog = dynamic(
  () => import('@/components/admin/CSVImportDialog'),
  {
    ssr: false,
  }
);

const ShachuHakuForm = dynamic(
  () => import('@/components/admin/ShachuHakuForm'),
  {
    ssr: false,
  }
);

// Reducer for atomic Promise + key updates
type ListPromiseAction =
  | { type: 'SET_PROMISE'; promise: Promise<any> }
  | { type: 'CLEAR_PROMISE' };

function listPromiseReducer(
  state: { promise: Promise<any> | null; key: number },
  action: ListPromiseAction
): { promise: Promise<any> | null; key: number } {
  switch (action.type) {
    case 'SET_PROMISE':
      return { promise: action.promise, key: state.key + 1 };
    case 'CLEAR_PROMISE':
      return { promise: null, key: state.key };
    default:
      return state;
  }
}

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
  if (isFree) return 'bg-green-500 hover:bg-green-600';
  if (!pricePerNight) return 'bg-gray-500 hover:bg-gray-600';
  if (pricePerNight <= 1000) return 'bg-yellow-500 hover:bg-yellow-600';
  if (pricePerNight <= 2000) return 'bg-orange-500 hover:bg-orange-600';
  return 'bg-red-500 hover:bg-red-600';
};

export default function AdminClient() {
  const { user, isLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check if user is admin
  const isAdmin =
    user?.email &&
    process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',')
      .map((email) => email.trim())
      .includes(user.email);
  const [spots, setSpots] = useState<CampingSpotWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpot, setSelectedSpot] = useState<CampingSpotWithId | null>(
    null
  );
  const [showForm, setShowForm] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
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
  const [clientFilters, setClientFilters] = useState<ClientSideFilterValues>({
    pricingFilter: 'all',
    minSecurityLevel: 0,
    minQuietnessLevel: 0,
    maxToiletDistance: null,
    minElevation: null,
    maxElevation: null,
  });

  // Map state for jump functionality
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    138.2529, 36.2048,
  ]); // Japan center
  const [mapZoom, setMapZoom] = useState(5);

  // Pagination state for list view
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  // Use reducer for atomic Promise + key updates
  const [listPromiseState, dispatchListPromise] = useReducer(
    listPromiseReducer,
    { promise: null, key: 0 }
  );

  // Bounds state for map view - use ref instead of state to prevent re-renders
  const mapBoundsRef = useRef<{
    north: number;
    south: number;
    east: number;
    west: number;
  } | null>(null);

  // Use custom hook for map bounds loading with optimized data fetching
  const {
    handleBoundsChange,
    cleanup: cleanupMapBoundsLoader,
    reloadIfNeeded,
    initialLoadDoneRef,
  } = useMapBoundsLoader({
    loadSpots: getCampingSpotsByBounds,
    setLoading,
    setSpots,
    toast,
    filters: {
      searchTerm,
      prefectureFilter: 'all',
      typeFilter,
    },
    // Admin-specific: also get total count for display
    onLoadSuccess: async (data, bounds, filters) => {
      const totalResult = await getCampingSpotsWithPagination(1, 1, filters);
      setTotalCount(totalResult.total);
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
    }
  ) => {
    try {
      setLoading(true);
      const result = await getCampingSpotsWithPagination(
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

  // Wrapper for handleBoundsChange that saves mapBoundsRef
  const handleBoundsChangeWrapper = useCallback(
    (bounds: { north: number; south: number; east: number; west: number }) => {
      mapBoundsRef.current = bounds;
      handleBoundsChange(bounds); // Call hook's handler
    },
    [handleBoundsChange]
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter]);

  // Load spots for list view when tab, filters, or page changes
  // Create and cache the promise with atomic updates
  useEffect(() => {
    console.log('[Admin] List useEffect triggered, activeTab:', activeTab);
    if (activeTab === 'list') {
      const filters = {
        searchTerm: searchTerm || undefined,
        prefecture: undefined,
        type:
          typeFilter !== 'all'
            ? typeFilter
            : undefined,
      };

      // Create new promise and dispatch atomic update
      console.log('[Admin] Creating promise with filters:', filters);
      const promise = getCampingSpotsWithPagination(
        currentPage,
        pageSize,
        filters
      );
      console.log('[Admin] Promise created:', promise);
      dispatchListPromise({ type: 'SET_PROMISE', promise });
      console.log('[Admin] Promise dispatched');
    } else {
      // Clear promise when switching away from list tab
      console.log('[Admin] Clearing promise (not on list tab)');
      dispatchListPromise({ type: 'CLEAR_PROMISE' });
    }
  }, [activeTab, currentPage, searchTerm, typeFilter]);

  // Reload map data when filters change (if map is active and bounds are available)
  useEffect(() => {
    if (activeTab === 'map') {
      reloadIfNeeded(mapBoundsRef.current);
    }
  }, [searchTerm, typeFilter, activeTab, reloadIfNeeded]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupMapBoundsLoader();
    };
  }, [cleanupMapBoundsLoader]);

  // Update URL when filters or tab change (on user interaction)
  const isInitialMountRef = useRef(true);
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

    // Update URL without reload
    const newUrl = params.toString()
      ? `/admin/shachu-haku?${params.toString()}`
      : '/admin/shachu-haku';
    router.replace(newUrl, { scroll: false });
  }, [searchTerm, typeFilter, activeTab, router]);

  const handleSpotSelect = (spot: CampingSpotWithId) => {
    // Navigate to the edit page with the spot ID
    router.push(`/admin/shachu-haku/${spot._id}`);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedSpot(null);
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

  const handleFormSuccess = () => {
    // Reload spots based on current tab
    if (activeTab === 'list') {
      const filters = {
        searchTerm: searchTerm || undefined,
        prefecture: undefined,
        type:
          typeFilter !== 'all'
            ? typeFilter
            : undefined,
      };
      loadListSpotsRef.current?.(currentPage, filters);
    } else if (activeTab === 'map' && mapBoundsRef.current) {
      const filters = {
        searchTerm: searchTerm || undefined,
        prefecture: undefined,
        type:
          typeFilter !== 'all'
            ? typeFilter
            : undefined,
      };
      loadMapSpotsRef.current?.(mapBoundsRef.current, filters);
      lastLoadedBoundsRef.current = mapBoundsRef.current;
    }
    handleFormClose();
    toast({
      title: '成功',
      description: selectedSpot
        ? '車中泊スポットを更新しました'
        : '車中泊スポットを作成しました',
    });
  };

  const handleImportSuccess = (result: { success: number; errors: any[] }) => {
    // Reload spots based on current tab
    if (activeTab === 'list') {
      const filters = {
        searchTerm: searchTerm || undefined,
        prefecture: undefined,
        type:
          typeFilter !== 'all'
            ? typeFilter
            : undefined,
      };
      loadListSpotsRef.current?.(currentPage, filters);
    } else if (activeTab === 'map' && mapBoundsRef.current) {
      const filters = {
        searchTerm: searchTerm || undefined,
        prefecture: undefined,
        type:
          typeFilter !== 'all'
            ? typeFilter
            : undefined,
      };
      loadMapSpotsRef.current?.(mapBoundsRef.current, filters);
      lastLoadedBoundsRef.current = mapBoundsRef.current;
    }
    toast({
      title: 'インポート完了',
      description: `${result.success}件の車中泊スポットをインポートしました`,
    });
    if (result.errors.length > 0) {
      toast({
        title: '警告',
        description: `${result.errors.length}件のエラーがありました`,
        variant: 'destructive',
      });
    }
  };

  // Apply client-side filters to spots
  const filteredSpots = filterSpotsClientSide(spots, clientFilters);

  const exportToCSV = async () => {
    try {
      const { getCampingSpotsForExport } = await import(
        '../../actions/campingSpots'
      );
      const exportSpots = await getCampingSpotsForExport();
      console.log('[Export] Total spots fetched:', exportSpots.length);

      const headers = [
        'name',
        'lat',
        'lng',
        'prefecture',
        'address',
        'url',
        'type',
        'distanceToToilet',
        'distanceToBath',
        'distanceToConvenience',
        'nearbyToiletLat',
        'nearbyToiletLng',
        'nearbyConvenienceLat',
        'nearbyConvenienceLng',
        'nearbyBathLat',
        'nearbyBathLng',
        'elevation',
        'securityHasGate',
        'securityHasLighting',
        'securityHasStaff',
        'nightNoiseHasNoiseIssues',
        'nightNoiseNearBusyRoad',
        'nightNoiseIsQuietArea',
        'hasRoof',
        'hasPowerOutlet',
        'hasGate',
        'isFree',
        'pricePerNight',
        'priceNote',
        'capacity',
        'capacityLarge',
        'restrictions',
        'amenities',
        'notes',
      ];

      // Helper function to escape CSV field
      const escapeCSVField = (field: any): string => {
        // Use empty string for null/undefined values
        const stringField = field == null ? '' : String(field);

        // Always quote fields that contain special characters
        if (
          stringField.includes(',') ||
          stringField.includes('"') ||
          stringField.includes('\n') ||
          stringField.includes('\r')
        ) {
          // Escape quotes by doubling them
          return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
      };

      const csvRows = [headers.join(',')];
      let processedCount = 0;
      let errorCount = 0;

      exportSpots.forEach((spot: CampingSpotWithId, index: number) => {
        try {
          const fields = [
            spot.name,
            spot.coordinates[1], // lat
            spot.coordinates[0], // lng
            spot.prefecture,
            spot.address || '',
            spot.url || '',
            spot.type,
            spot.distanceToToilet || '',
            spot.distanceToBath || '',
            spot.distanceToConvenience || '',
            spot.nearbyToiletCoordinates?.[1] ?? '', // nearbyToiletLat
            spot.nearbyToiletCoordinates?.[0] ?? '', // nearbyToiletLng
            spot.nearbyConvenienceCoordinates?.[1] ?? '', // nearbyConvenienceLat
            spot.nearbyConvenienceCoordinates?.[0] ?? '', // nearbyConvenienceLng
            spot.nearbyBathCoordinates?.[1] ?? '', // nearbyBathLat
            spot.nearbyBathCoordinates?.[0] ?? '', // nearbyBathLng
            spot.elevation || '',
            // Security and night noise objective data fields
            spot.security?.hasGate ? 'true' : 'false',
            spot.security?.hasLighting ? 'true' : 'false',
            spot.security?.hasStaff ? 'true' : 'false',
            spot.nightNoise?.hasNoiseIssues ? 'true' : 'false',
            spot.nightNoise?.nearBusyRoad ? 'true' : 'false',
            spot.nightNoise?.isQuietArea ? 'true' : 'false',
            spot.hasRoof ? 'true' : 'false',
            spot.hasPowerOutlet ? 'true' : 'false',
            spot.security?.hasGate ? 'true' : 'false', // hasGate (duplicate for backward compatibility)
            spot.pricing.isFree ? 'true' : 'false',
            spot.pricing.pricePerNight || '',
            spot.pricing.priceNote || '',
            spot.capacity || '',
            spot.capacityLarge || '',
            spot.restrictions.join(','),
            spot.amenities.join(','),
            spot.notes || '',
          ];
          csvRows.push(fields.map(escapeCSVField).join(','));
          processedCount++;
        } catch (error) {
          console.error(`[Export] Error processing spot ${index}:`, spot.name, error);
          errorCount++;
        }
      });

      console.log('[Export] Processing complete:', {
        totalFetched: exportSpots.length,
        processedCount,
        errorCount,
        csvRowsCount: csvRows.length - 1 // -1 for header
      });

      // Use \r\n for Windows compatibility and to avoid issues with quoted newlines
      const csvContent = csvRows.join('\r\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `shachu-haku-spots-${
        new Date().toISOString().split('T')[0]
      }.csv`;
      link.click();
    } catch (error) {
      toast({
        title: 'エラー',
        description: 'エクスポートに失敗しました',
        variant: 'destructive',
      });
      console.error('Export error:', error);
    }
  };

  if (isLoading || !user) {
    // For loading states, return null and let Suspense handle it
    return null;
  }

  if (!isAdmin) {
    return (
      <div className='flex flex-col justify-center items-center h-screen space-y-4'>
        <h1 className='text-2xl font-bold text-red-600'>アクセス拒否</h1>
        <p className='text-gray-600 dark:text-gray-300'>
          この機能は管理者のみ利用可能です。
        </p>
        <p className='text-sm text-gray-500 dark:text-gray-400'>
          管理者権限が必要な場合は、システム管理者にお問い合わせください。
        </p>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-6 py-6 space-y-6 min-h-screen'>
      <div className='space-y-4'>
        <div className='flex justify-between items-center'>
          <h1 className='text-3xl font-bold'>車中泊スポット管理</h1>
          <div className='flex gap-2'>
            <Link href='/admin/submissions'>
              <Button variant='outline' className='hidden md:flex'>
                <Users className='w-4 h-4 mr-2' />
                投稿管理
              </Button>
            </Link>
            <Button
              onClick={() => setShowImportDialog(true)}
              variant='outline'
              className='hidden md:flex'
            >
              <Upload className='w-4 h-4 mr-2' />
              CSVインポート
            </Button>
            <Button
              onClick={exportToCSV}
              variant='outline'
              className='hidden md:flex'
            >
              <Download className='w-4 h-4 mr-2' />
              CSVエクスポート
            </Button>
            <Button
              onClick={() => setShowForm(true)}
              className='hidden md:flex'
            >
              <Plus className='w-4 h-4 mr-2' />
              新規追加
            </Button>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)} className='md:hidden w-full'>
          <Plus className='w-4 h-4 mr-2' />
          新規追加
        </Button>
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
            onClick={() => setActiveTab('map')}
            className='rounded-b-none'
          >
            <MapPin className='w-4 h-4 mr-2' />
            地図表示
          </Button>
          <Button
            variant={activeTab === 'list' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('list')}
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
                    地図から編集 (読み込み中... <Spinner className='size-4' />)
                  </span>
                ) : totalCount > 0 ? (
                  `地図から編集 (${filteredSpots.length}件${
                    hasActiveClientFilters(clientFilters)
                      ? ` / ${spots.length}件中`
                      : `中${spots.length}件`
                  })`
                ) : (
                  `地図から編集 (${filteredSpots.length}件)`
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ShachuHakuMap
                key='shachu-haku-admin-map'
                spots={filteredSpots}
                onSpotSelect={handleSpotSelect}
                onBoundsChange={handleBoundsChangeWrapper}
                initialCenter={mapCenter}
                initialZoom={mapZoom}
                onCreateSpot={(coordinates) => {
                  setSelectedSpot({
                    coordinates,
                    name: '',
                    prefecture: '',
                    type: 'other',
                    distanceToToilet: 0,
                    quietnessLevel: 3,
                    securityLevel: 3,
                    overallRating: 3,
                    hasRoof: false,
                    hasPowerOutlet: false,
                    hasGate: false,
                    pricing: { isFree: true },
                    capacity: 1,
                    restrictions: [],
                    amenities: [],
                    notes: '',
                    isVerified: false,
                  } as any);
                  setShowForm(true);
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* List Tab Content */}
        {activeTab === 'list' && (
          <div className='space-y-4'>
            {listPromiseState.promise ? (
              <>
                {/* Spots List - use + Suspense */}
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
                  key={`list-${listPromiseState.key}`}
                >
                  <AdminSpotsList
                    spotsPromise={listPromiseState.promise}
                    onSpotSelect={handleSpotSelect}
                    onPageChange={setCurrentPage}
                    clientFilters={clientFilters}
                  />
                </Suspense>
              </>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                {[...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className='p-4'>
                      <div className='h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-10 mb-2'></div>
                      <div className='h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-24'></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <ShachuHakuForm
          key={selectedSpot?._id || 'new'}
          spot={selectedSpot}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}

      {showImportDialog && (
        <CSVImportDialog
          onClose={() => setShowImportDialog(false)}
          onSuccess={handleImportSuccess}
        />
      )}
    </div>
  );
}
