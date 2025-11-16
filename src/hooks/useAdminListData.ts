import { useState, useEffect, useCallback, useRef, MutableRefObject } from 'react';
import { getCampingSpotsWithPagination } from '../app/actions/campingSpots/admin';
import { CampingSpotWithId } from '@/data/schemas/campingSpot';

type ListData = {
  spots: CampingSpotWithId[];
  total: number;
  page: number;
  totalPages: number;
};

type UseAdminListDataParams = {
  /**
   * Current active tab
   */
  activeTab: 'map' | 'list';
  /**
   * Search term filter
   */
  searchTerm: string;
  /**
   * Type filter (e.g., 'parking', 'roadside', 'all')
   */
  typeFilter: string;
  /**
   * Number of items per page
   * @default 20
   */
  pageSize?: number;
  /**
   * Toast notification function
   */
  toast: (options: {
    title: string;
    description: string;
    variant?: 'default' | 'destructive';
  }) => void;
  /**
   * Ref to track if initial data load is complete (from map bounds loader)
   */
  initialLoadDoneRef?: MutableRefObject<boolean>;
};

type UseAdminListDataReturn = {
  /**
   * List view data (spots, total, page, totalPages)
   */
  listData: ListData | null;
  /**
   * Whether list data is currently loading
   */
  listLoading: boolean;
  /**
   * Current page number
   */
  currentPage: number;
  /**
   * Set current page number
   */
  setCurrentPage: (page: number) => void;
  /**
   * Manually refresh list data with current filters
   */
  refreshListData: () => Promise<void>;
  /**
   * Internal ref for tracking last loaded filters (exposed for special cases)
   */
  lastListFiltersRef: MutableRefObject<string | null>;
};

/**
 * Custom hook to manage admin list view data and pagination
 *
 * Handles automatic data loading when switching to list tab, pagination,
 * and filter-based data fetching with deduplication.
 *
 * @example
 * ```tsx
 * const {
 *   listData,
 *   listLoading,
 *   currentPage,
 *   setCurrentPage,
 *   refreshListData,
 *   lastListFiltersRef
 * } = useAdminListData({
 *   activeTab,
 *   searchTerm,
 *   typeFilter,
 *   pageSize: 20,
 *   toast
 * });
 *
 * // List data is automatically loaded when activeTab === 'list'
 * // Manually refresh if needed:
 * await refreshListData();
 * ```
 */
export function useAdminListData({
  activeTab,
  searchTerm,
  typeFilter,
  pageSize = 20,
  toast,
  initialLoadDoneRef,
}: UseAdminListDataParams): UseAdminListDataReturn {
  const [listData, setListData] = useState<ListData | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Track last loaded filters to prevent duplicate requests
  const lastListFiltersRef = useRef<string | null>(null);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter]);

  // Refresh list data with current filters
  const refreshListData = useCallback(async () => {
    const filters = {
      searchTerm: searchTerm || undefined,
      prefecture: undefined,
      type: typeFilter !== 'all' ? typeFilter : undefined,
    };

    try {
      setListLoading(true);
      const data = await getCampingSpotsWithPagination(
        currentPage,
        pageSize,
        filters
      );
      setListData(data);

      // Mark initial load as done if ref is provided
      if (initialLoadDoneRef) {
        initialLoadDoneRef.current = true;
      }
    } catch (error) {
      console.error('[Admin] Error loading list data:', error);
      toast({
        title: 'エラー',
        description: '車中泊スポットの読み込みに失敗しました',
        variant: 'destructive',
      });
    } finally {
      setListLoading(false);
    }
  }, [searchTerm, typeFilter, currentPage, pageSize, toast, initialLoadDoneRef]);

  // Auto-load data when switching to list tab or when filters/page changes
  useEffect(() => {
    if (activeTab !== 'list') {
      return;
    }

    const filters = {
      searchTerm: searchTerm || undefined,
      prefecture: undefined,
      type: typeFilter !== 'all' ? typeFilter : undefined,
    };

    // Create a stable string representation of filters for comparison
    const filtersKey = JSON.stringify({
      searchTerm: filters.searchTerm,
      prefecture: filters.prefecture,
      type: filters.type,
      page: currentPage,
    });

    // Skip if we already initiated a request with the same filters
    // (prevents multiple API calls during loading)
    if (lastListFiltersRef.current === filtersKey) {
      return;
    }

    // Note: Unlike the public page, admin list view shows ALL data (not bounded by map view),
    // so we always need to fetch from API, even when switching from map view.
    // Map view shows only spots in visible area, while list view shows all spots.

    // Load data from API
    lastListFiltersRef.current = filtersKey;
    setListLoading(true);

    getCampingSpotsWithPagination(currentPage, pageSize, filters)
      .then((data) => {
        setListData(data);
        setListLoading(false);
      })
      .catch((error) => {
        console.error('[Admin] Error loading list data:', error);
        toast({
          title: 'エラー',
          description: '車中泊スポットの読み込みに失敗しました',
          variant: 'destructive',
        });
        setListLoading(false);
      });
  }, [activeTab, currentPage, searchTerm, typeFilter, pageSize, toast]);

  return {
    listData,
    listLoading,
    currentPage,
    setCurrentPage,
    refreshListData,
    lastListFiltersRef,
  };
}
