'use client';

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  startTransition,
} from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useToast } from '@/components/ui/use-toast';
import { useMapBoundsLoader } from '@/hooks/useMapBoundsLoader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Download, MapPin, Plus, Users } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import Link from 'next/link';
import { getCampingSpotsByBounds } from '../../actions/campingSpots/admin';
import { CampingSpotWithId } from '@/data/schemas/campingSpot';
import {
  CSVImportResult,
  getCampingSpotsForExport,
} from '../../actions/campingSpots/csv';
import ShachuHakuFilters from '@/components/shachu-haku/ShachuHakuFilters';
import { AdminSpotsList } from '@/components/admin/AdminSpotsList';
import { celebrateSubmission, playCelebrationSound } from '@/lib/confetti';
import { useShachuHakuFilters } from '@/hooks/useShachuHakuFilters';
import { SpotPopup } from '@/components/shachu-haku/SpotPopup';
import { useLocationNavigation } from '@/hooks/useLocationNavigation';
import { useSpotFiltering } from '@/hooks/useSpotFiltering';
import { usePendingSubmissions } from '@/hooks/usePendingSubmissions';
import { useAdminSpotForm } from '@/hooks/useAdminSpotForm';
import { useAdminListData } from '@/hooks/useAdminListData';
import { downloadCampingSpotsCSV } from '@/lib/csv/campingSpots';
import { useUrlSync } from '@/hooks/useUrlSync';
import { AUTO_SAVE_KEY } from '@/constants/formDefaults';

// Dynamically import the map component to avoid SSR issues
const ShachuHakuMap = dynamic(
  () => import('@/components/admin/ShachuHakuMap'),
  {
    ssr: false,
    loading: () => (
      <div className='h-[600px] bg-gray-100 animate-pulse rounded-lg' />
    ),
  },
);

const CSVImportDialog = dynamic(
  () => import('@/components/admin/CSVImportDialog'),
  {
    ssr: false,
  },
);

const ShachuHakuForm = dynamic(
  () => import('@/components/admin/ShachuHakuForm'),
  {
    ssr: false,
  },
);

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

  // State for map view
  const [spots, setSpots] = useState<CampingSpotWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Use custom hooks
  const { pendingCount: pendingSubmissionsCount } = usePendingSubmissions({
    isAdmin: !!isAdmin,
  });

  const {
    selectedSpot,
    showForm,
    isNewSpot,
    openForm,
    closeForm,
    handleSpotSelect,
    clearSelection,
  } = useAdminSpotForm();

  // Bounds state for map view - use ref instead of state to prevent re-renders
  const mapBoundsRef = useRef<{
    north: number;
    south: number;
    east: number;
    west: number;
  } | null>(null);
  const prevActiveTabRef = useRef<'map' | 'list'>(activeTab);

  // Use custom hook for map bounds loading with optimized data fetching
  const {
    handleBoundsChange,
    cleanup: cleanupMapBoundsLoader,
    reloadIfNeeded,
    initialLoadDoneRef,
    lastLoadedBoundsRef,
  } = useMapBoundsLoader({
    loadSpots: getCampingSpotsByBounds,
    setLoading,
    setSpots,
    setTotalCount,
    toast,
    filters: {
      searchTerm,
      prefectureFilter: 'all',
      typeFilter,
    },
  });

  // Use custom hook for list view data management
  const {
    listData,
    listLoading,
    setCurrentPage,
    refreshListData,
    lastListFiltersRef,
    allSpotIds,
    refreshAllSpotIds,
  } = useAdminListData({
    activeTab,
    searchTerm,
    typeFilter,
    pageSize: 20,
    toast,
    initialLoadDoneRef,
  });

  // Wrapper for handleBoundsChange that saves mapBoundsRef and savedBounds
  const handleBoundsChangeWrapper = useCallback(
    (bounds: { north: number; south: number; east: number; west: number }) => {
      mapBoundsRef.current = bounds;
      setSavedBounds(bounds); // Save bounds for visible spots calculation

      // If data is already loaded (from list view) and lastLoadedBoundsRef is null,
      // set it to current bounds to prevent unnecessary API call
      if (initialLoadDoneRef.current && !lastLoadedBoundsRef.current) {
        lastLoadedBoundsRef.current = bounds;
        // Don't call handleBoundsChange since we already have data
        return;
      }

      handleBoundsChange(bounds); // Call hook's handler
    },
    [handleBoundsChange, initialLoadDoneRef, lastLoadedBoundsRef],
  );

  // Reload map data when switching to map tab or when filters change
  useEffect(() => {
    const isTabChangedToMap =
      prevActiveTabRef.current !== 'map' && activeTab === 'map';
    prevActiveTabRef.current = activeTab;

    if (isTabChangedToMap) {
      // Tab just changed to map
      // If data is already loaded (from list view), update lastLoadedBoundsRef
      // to prevent unnecessary API calls when map initializes
      if (initialLoadDoneRef.current && mapBoundsRef.current) {
        lastLoadedBoundsRef.current = mapBoundsRef.current;
      }
      // Map component will initialize itself and call handleBoundsChange automatically
    } else if (activeTab === 'map') {
      // Already on map tab, reload if filters changed
      reloadIfNeeded(mapBoundsRef.current);
    }
  }, [
    searchTerm,
    typeFilter,
    activeTab,
    reloadIfNeeded,
    initialLoadDoneRef,
    lastLoadedBoundsRef,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupMapBoundsLoader();
    };
  }, [cleanupMapBoundsLoader]);

  // Sync URL with filters and tab state
  useUrlSync({
    params: {
      tab: activeTab === 'list' ? 'list' : null,
      q: searchTerm || null,
      type: typeFilter !== 'all' ? typeFilter : null,
    },
    basePath: '/admin/shachu-haku',
  });

  const handleNavigateToEdit = (spotId: string) => {
    // Clear LocalStorage auto-save data before navigating to edit mode
    localStorage.removeItem(AUTO_SAVE_KEY);

    // Save the current filtered spot IDs for navigation
    if (activeTab === 'map') {
      // Map view: use visible spots in current bounds
      const spotIds = visibleSpots.map((s) => s._id);
      sessionStorage.setItem('admin-spot-ids', JSON.stringify(spotIds));
    } else if (activeTab === 'list') {
      // List view: use ALL filtered spot IDs (not just current page)
      sessionStorage.setItem('admin-spot-ids', JSON.stringify(allSpotIds));
    }
    // Navigate to the edit page with the spot ID
    router.push(`/admin/shachu-haku/${spotId}`);
  };

  // Use location navigation hook
  const { handlePrefectureJump, handleRegionJump, handleCurrentLocation } =
    useLocationNavigation({
      setMapCenter,
      setMapZoom,
      setSavedBounds,
      toast,
    });

  const handleFormSuccess = async (createdId?: string) => {
    // 作成・更新時は紙吹雪と祝福音でお祝い
    celebrateSubmission();
    playCelebrationSound();

    // 新規作成時は編集ページにリダイレクト
    if (isNewSpot && createdId) {
      router.push(`/admin/shachu-haku/${createdId}`);
      return;
    }

    // Reload spots based on current tab
    if (activeTab === 'list') {
      // Clear the last filters ref to force re-fetch
      lastListFiltersRef.current = null;
      // Manually trigger data reload for list view
      refreshListData();
      // Refresh all spot IDs for navigation
      refreshAllSpotIds();
    } else if (activeTab === 'map' && mapBoundsRef.current) {
      // Use the hook's reloadIfNeeded function to reload map data
      reloadIfNeeded(mapBoundsRef.current);
    }
    closeForm();
    toast({
      title: isNewSpot ? '🎉 作成完了' : '🎉 更新完了',
      description: isNewSpot
        ? '車中泊スポットを作成しました'
        : '車中泊スポットを更新しました',
    });
  };

  const handleImportSuccess = async (result: CSVImportResult) => {
    // Reload spots based on current tab
    if (activeTab === 'list') {
      // Clear the last filters ref to force re-fetch
      lastListFiltersRef.current = null;
      // Manually trigger data reload for list view
      refreshListData();
      // Refresh all spot IDs for navigation
      refreshAllSpotIds();
    } else if (activeTab === 'map' && mapBoundsRef.current) {
      // Use the hook's reloadIfNeeded function to reload map data
      reloadIfNeeded(mapBoundsRef.current);
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

  // Use spot filtering hook
  const { filteredSpots, visibleSpots, activeFilterDescriptions } =
    useSpotFiltering({
      spots,
      clientFilters,
      savedBounds,
      searchTerm,
      typeFilter,
    });

  const exportToCSV = async () => {
    try {
      // Use statically imported server action
      const exportSpots = await getCampingSpotsForExport();

      // Use the new utility function for CSV export
      downloadCampingSpotsCSV(exportSpots);

      toast({
        title: 'エクスポート完了',
        description: `${exportSpots.length}件の車中泊スポットをエクスポートしました`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'エラー',
        description: 'エクスポートに失敗しました',
        variant: 'destructive',
      });
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
        <div className='flex justify-between items-center bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg px-4 py-3'>
          <h1 className='text-3xl font-bold'>車中泊スポット管理</h1>
          <div className='flex gap-2'>
            <Link href='/admin/submissions'>
              <Button
                variant='outline'
                className='hidden md:flex relative cursor-pointer'
              >
                <Users className='w-4 h-4 mr-2' />
                投稿管理
                {pendingSubmissionsCount > 0 && (
                  <Badge
                    variant='destructive'
                    className='ml-2 px-1.5 py-0.5 text-xs'
                  >
                    {pendingSubmissionsCount}
                  </Badge>
                )}
              </Button>
            </Link>
            <Button
              onClick={() => setShowImportDialog(true)}
              variant='outline'
              disabled={loading}
              className='hidden md:flex cursor-pointer'
            >
              <Upload className='w-4 h-4 mr-2' />
              CSVインポート
            </Button>
            <Button
              onClick={exportToCSV}
              variant='outline'
              disabled={loading}
              className='hidden md:flex cursor-pointer'
            >
              <Download className='w-4 h-4 mr-2' />
              CSVエクスポート
            </Button>
            <Button
              onClick={() => openForm()}
              disabled={loading}
              className='hidden md:flex cursor-pointer'
            >
              <Plus className='w-4 h-4 mr-2' />
              新規追加
            </Button>
          </div>
        </div>
        <Button
          onClick={() => openForm()}
          disabled={loading}
          className='md:hidden w-full cursor-pointer'
        >
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
          onResetAll={handleResetAllFromHook}
        />

        {/* Tab Navigation */}
        <div className='flex space-x-2 mb-6 border-b border-gray-200 dark:border-gray-700'>
          <Button
            variant={activeTab === 'map' ? 'default' : 'ghost'}
            onClick={() => startTransition(() => setActiveTab('map'))}
            className='rounded-b-none cursor-pointer'
          >
            <MapPin className='w-4 h-4 mr-2' />
            地図表示
          </Button>
          <Button
            variant={activeTab === 'list' ? 'default' : 'ghost'}
            onClick={() => startTransition(() => setActiveTab('list'))}
            className='rounded-b-none cursor-pointer'
          >
            一覧表示
          </Button>
        </div>

        {/* Map Tab Content - Always render but hide with visibility */}
        <div
          style={{
            visibility: activeTab === 'map' ? 'visible' : 'hidden',
            height: activeTab === 'map' ? 'auto' : '0',
            overflow: 'hidden',
          }}
        >
          {/* lg以上: 地図と詳細パネルを横並び / lg未満: 縦積み */}
          <div className='flex flex-col lg:flex-row lg:items-stretch gap-4'>
            {/* 地図 */}
            <div className='flex-1 min-w-0'>
              <Card>
                <CardHeader className='pb-2'>
                  <CardTitle className='flex items-center gap-2'>
                    <MapPin className='w-5 h-5' />
                    {loading ? (
                      <span className='flex items-center gap-2'>
                        読み込み中... <Spinner className='size-4' />
                      </span>
                    ) : (
                      `表示範囲内: ${visibleSpots.length}件（全${totalCount}件中）`
                    )}
                  </CardTitle>
                  {!loading && activeFilterDescriptions.length > 0 && (
                    <div className='text-sm text-muted-foreground space-y-1 mt-1'>
                      {activeFilterDescriptions.map((desc, index) => (
                        <div key={index}>{desc}</div>
                      ))}
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <ShachuHakuMap
                    key='shachu-haku-admin-map'
                    spots={filteredSpots}
                    onSpotSelect={handleSpotSelect}
                    onBoundsChange={handleBoundsChangeWrapper}
                    initialCenter={mapCenter}
                    initialZoom={mapZoom}
                    initialBounds={savedBounds || undefined}
                    activatedSpotId={selectedSpot?._id ?? null}
                    onCreateSpot={(coordinates) => {
                      openForm({
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
                    }}
                  />
                </CardContent>
              </Card>
            </div>

            {/* スポット詳細パネル: lg以上は右側固定幅、lg未満は下に表示 */}
            {activeTab === 'map' && selectedSpot && (
              <div className='lg:w-80 lg:shrink-0 lg:flex lg:flex-col'>
                <SpotPopup
                  spot={selectedSpot}
                  onClose={clearSelection}
                  className='lg:flex-1'
                  actionButton={
                    <Button
                      onClick={() => handleNavigateToEdit(selectedSpot._id)}
                      className='bg-blue-600 hover:bg-blue-700 text-white cursor-pointer px-3 py-1 shrink-0'
                      size='sm'
                    >
                      編集
                    </Button>
                  }
                />
              </div>
            )}
          </div>
        </div>

        {/* List Tab Content */}
        {activeTab === 'list' && (
          <div className='space-y-4'>
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
              <AdminSpotsList
                spots={listData.spots}
                total={listData.total}
                page={listData.page}
                totalPages={listData.totalPages}
                onSpotSelect={handleSpotSelect}
                onPageChange={setCurrentPage}
                clientFilters={clientFilters}
                allSpotIds={allSpotIds}
              />
            )}
          </div>
        )}
      </div>

      {showForm && (
        <ShachuHakuForm
          key={selectedSpot?._id || 'new'}
          spot={selectedSpot}
          onClose={closeForm}
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
