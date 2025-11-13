import { useState, useEffect, useCallback } from 'react';
import { getCampingSpotSubmissions } from '../app/actions/campingSpotSubmissions';

type UsePendingSubmissionsParams = {
  /**
   * Whether the current user is an admin
   */
  isAdmin: boolean;
  /**
   * Whether to automatically load on mount
   * @default true
   */
  autoLoad?: boolean;
};

type UsePendingSubmissionsReturn = {
  /**
   * Number of pending submissions
   */
  pendingCount: number;
  /**
   * Whether the data is currently loading
   */
  loading: boolean;
  /**
   * Manually refresh the pending submissions count
   */
  refreshPendingCount: () => Promise<void>;
};

/**
 * Custom hook to manage pending camping spot submissions count
 *
 * @example
 * ```tsx
 * const { pendingCount, loading, refreshPendingCount } = usePendingSubmissions({
 *   isAdmin: true
 * });
 * ```
 */
export function usePendingSubmissions({
  isAdmin,
  autoLoad = true,
}: UsePendingSubmissionsParams): UsePendingSubmissionsReturn {
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refreshPendingCount = useCallback(async () => {
    if (!isAdmin) {
      setPendingCount(0);
      return;
    }

    try {
      setLoading(true);
      const submissions = await getCampingSpotSubmissions();
      const count = submissions.filter(
        (s: { status: string }) => s.status === 'pending'
      ).length;
      setPendingCount(count);
    } catch (error) {
      console.error('Error loading pending submissions count:', error);
      // Keep the previous count on error
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  // Auto-load on mount if enabled
  useEffect(() => {
    if (autoLoad && isAdmin) {
      refreshPendingCount();
    }
  }, [autoLoad, isAdmin, refreshPendingCount]);

  return {
    pendingCount,
    loading,
    refreshPendingCount,
  };
}
