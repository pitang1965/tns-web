import { useRef, useCallback } from 'react';
import { CampingSpotWithId } from '@/data/schemas/campingSpot';

// Maximum display range for public users (scraping prevention)
// Admin uses this hook without onBoundsTooWide, so the limit is not applied
export const MAX_LNG_SPAN = 6;
export const MAX_LAT_SPAN = 4;

type Bounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

type Filters = {
  searchTerm?: string;
  prefecture?: string;
  type?: string;
};

type UseMapBoundsLoaderOptions = {
  loadSpots: (
    bounds: Bounds,
    filters?: Filters
  ) => Promise<CampingSpotWithId[] | { spots: CampingSpotWithId[]; total: number }>;
  setLoading: (loading: boolean) => void;
  setSpots: (spots: CampingSpotWithId[]) => void;
  setTotalCount?: (total: number) => void;
  toast: (options: {
    title: string;
    description: string;
    variant?: 'destructive';
  }) => void;
  filters: {
    searchTerm: string;
    prefectureFilter: string;
    typeFilter: string;
  };
  onLoadSuccess?: (data: CampingSpotWithId[], bounds: Bounds, filters: Filters) => Promise<void>;
  onBoundsTooWide?: (tooWide: boolean) => void;
};

/**
 * Custom hook for managing map bounds changes with optimized data loading
 * - Debounces bounds changes (800ms mobile, 500ms desktop)
 * - Cancels previous requests using AbortController
 * - Skips data loading when zooming in (data already available)
 * - Only loads data when bounds change significantly (>5% threshold)
 */
export function useMapBoundsLoader({
  loadSpots,
  setLoading,
  setSpots,
  setTotalCount,
  toast,
  filters,
  onLoadSuccess,
  onBoundsTooWide,
}: UseMapBoundsLoaderOptions) {
  const boundsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastLoadedBoundsRef = useRef<Bounds | null>(null);
  const initialLoadDoneRef = useRef(false);
  const filtersRef = useRef(filters);
  const wasBoundsTooWideRef = useRef(false);

  // Update filters ref when filters change
  filtersRef.current = filters;

  // Helper function to check if bounds have significantly changed
  const boundsHaveChanged = (oldBounds: Bounds | null, newBounds: Bounds): boolean => {
    if (!oldBounds) return true;

    // Calculate the difference as a percentage of the current view
    const latDiff =
      Math.abs(newBounds.north - oldBounds.north) +
      Math.abs(newBounds.south - oldBounds.south);
    const lngDiff =
      Math.abs(newBounds.east - oldBounds.east) +
      Math.abs(newBounds.west - oldBounds.west);

    const latRange = newBounds.north - newBounds.south;
    const lngRange = newBounds.east - newBounds.west;

    // Only reload if bounds changed by more than 5% of current view
    const threshold = 0.05;
    return latDiff / latRange > threshold || lngDiff / lngRange > threshold;
  };

  // Helper function to check if new bounds are completely within old bounds (zoom in)
  const isZoomIn = (oldBounds: Bounds | null, newBounds: Bounds): boolean => {
    if (!oldBounds) return false;

    // Check if new bounds are completely within old bounds
    // Add small epsilon to account for floating point precision
    const epsilon = 0.0001;
    return (
      newBounds.north <= oldBounds.north + epsilon &&
      newBounds.south >= oldBounds.south - epsilon &&
      newBounds.east <= oldBounds.east + epsilon &&
      newBounds.west >= oldBounds.west - epsilon
    );
  };

  // Load spots with abort controller support
  const loadSpotsWithAbort = async (bounds: Bounds, requestFilters: Filters) => {
    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    const currentController = abortControllerRef.current;

    try {
      setLoading(true);

      const result = await loadSpots(bounds, requestFilters);

      // Only update state if this request wasn't aborted
      if (!currentController.signal.aborted) {
        // Handle both array and object return types
        if (Array.isArray(result)) {
          // Legacy: array of spots
          setSpots(result);
          if (onLoadSuccess) {
            await onLoadSuccess(result, bounds, requestFilters);
          }
        } else {
          // New: object with spots and total
          setSpots(result.spots);
          if (setTotalCount) {
            setTotalCount(result.total);
          }
          if (onLoadSuccess) {
            await onLoadSuccess(result.spots, bounds, requestFilters);
          }
        }
      }
    } catch (error) {
      // Ignore abort errors - don't touch loading state for aborted requests
      // because a newer request is already in progress
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      if (!currentController.signal.aborted) {
        toast({
          title: 'エラー',
          description: '車中泊スポットの読み込みに失敗しました',
          variant: 'destructive',
        });
        console.error('Error loading spots:', error);
      }
    } finally {
      // Only turn off loading if this request wasn't aborted.
      // Aborted requests should not clear loading state because
      // a newer request is already in progress with its own loading state.
      if (!currentController.signal.aborted) {
        setLoading(false);
      }
    }
  };

  // Handle bounds change with debounce
  const handleBoundsChange = useCallback(
    (bounds: Bounds) => {
      // Clear existing timeout
      if (boundsTimeoutRef.current) {
        clearTimeout(boundsTimeoutRef.current);
      }

      // For initial load, execute immediately without debounce
      const isInitialLoad = !initialLoadDoneRef.current;

      const executeLoad = () => {
        // Check if bounds span exceeds the public limit (only when onBoundsTooWide is provided)
        if (onBoundsTooWide) {
          const lngSpan = bounds.east - bounds.west;
          const latSpan = bounds.north - bounds.south;
          if (lngSpan > MAX_LNG_SPAN || latSpan > MAX_LAT_SPAN) {
            setSpots([]);
            if (setTotalCount) setTotalCount(0);
            setLoading(false);
            onBoundsTooWide(true);
            wasBoundsTooWideRef.current = true;
            initialLoadDoneRef.current = true;
            return;
          }
          onBoundsTooWide(false);
        }

        // Skip loading if zooming in (new bounds are completely within old bounds)
        // because we already have all the data for the visible area
        // But not on initial load, and not if we were previously in too-wide state
        // (spots were cleared, so we must reload)
        const wasWide = wasBoundsTooWideRef.current;
        wasBoundsTooWideRef.current = false;
        if (!wasWide && !isInitialLoad && isZoomIn(lastLoadedBoundsRef.current, bounds)) {
          return; // Skip loading for zoom in
        }

        // Check if bounds have significantly changed
        // Skip this check on initial load
        if (!isInitialLoad && !boundsHaveChanged(lastLoadedBoundsRef.current, bounds)) {
          return; // Skip loading if bounds haven't changed significantly
        }

        const requestFilters = {
          searchTerm: filtersRef.current.searchTerm || undefined,
          prefecture:
            filtersRef.current.prefectureFilter !== 'all'
              ? filtersRef.current.prefectureFilter
              : undefined,
          type:
            filtersRef.current.typeFilter !== 'all'
              ? filtersRef.current.typeFilter
              : undefined,
        };

        loadSpotsWithAbort(bounds, requestFilters);
        lastLoadedBoundsRef.current = bounds; // Update last loaded bounds
        initialLoadDoneRef.current = true;
      };

      // If initial load, execute immediately; otherwise, debounce
      if (isInitialLoad) {
        executeLoad();
      } else {
        // Set new timeout for debounced load
        // Use longer debounce on mobile devices (800ms) to reduce request frequency during gesture-heavy interactions
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const debounceTime = isMobile ? 800 : 500;
        boundsTimeoutRef.current = setTimeout(executeLoad, debounceTime);
      }
    },
    [] // Empty deps - all functions used inside are from refs or props that don't change
  );

  // Cleanup function
  const cleanup = useCallback(() => {
    if (boundsTimeoutRef.current) {
      clearTimeout(boundsTimeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Force reload when filters change (if initial load is done)
  const reloadIfNeeded = useCallback((bounds: Bounds | null) => {
    if (bounds && initialLoadDoneRef.current) {
      // Reset last loaded bounds to force reload when filters change
      lastLoadedBoundsRef.current = null;

      const requestFilters = {
        searchTerm: filtersRef.current.searchTerm || undefined,
        prefecture:
          filtersRef.current.prefectureFilter !== 'all'
            ? filtersRef.current.prefectureFilter
            : undefined,
        type:
          filtersRef.current.typeFilter !== 'all'
            ? filtersRef.current.typeFilter
            : undefined,
      };

      loadSpotsWithAbort(bounds, requestFilters);
      lastLoadedBoundsRef.current = bounds; // Update after loading
    }
  }, []);

  return {
    handleBoundsChange,
    cleanup,
    reloadIfNeeded,
    initialLoadDoneRef,
    lastLoadedBoundsRef,
  };
}
