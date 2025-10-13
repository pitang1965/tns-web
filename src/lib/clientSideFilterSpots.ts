import { CampingSpotWithId } from '@/data/schemas/campingSpot';
import {
  calculateSecurityLevel,
  calculateQuietnessLevel,
} from '@/lib/campingSpotUtils';
import { ClientSideFilterValues } from '@/components/shachu-haku/ClientSideFilters';

/**
 * クライアント側でスポットをフィルタリングする関数
 */
export function filterSpotsClientSide(
  spots: CampingSpotWithId[],
  filters: ClientSideFilterValues
): CampingSpotWithId[] {
  return spots.filter((spot) => {
    // 料金フィルター
    if (filters.pricingFilter === 'free' && !spot.pricing.isFree) {
      return false;
    }
    if (filters.pricingFilter === 'paid' && spot.pricing.isFree) {
      return false;
    }

    // 治安レベルフィルター
    if (filters.minSecurityLevel > 0) {
      const securityLevel = calculateSecurityLevel(spot);
      if (securityLevel < filters.minSecurityLevel) {
        return false;
      }
    }

    // 静けさレベルフィルター
    if (filters.minQuietnessLevel > 0) {
      const quietnessLevel = calculateQuietnessLevel(spot);
      if (quietnessLevel < filters.minQuietnessLevel) {
        return false;
      }
    }

    // トイレまでの距離フィルター
    if (filters.maxToiletDistance !== null) {
      if (
        !spot.distanceToToilet ||
        spot.distanceToToilet > filters.maxToiletDistance
      ) {
        return false;
      }
    }

    // 標高フィルター (最小値)
    if (filters.minElevation !== null) {
      if (!spot.elevation || spot.elevation < filters.minElevation) {
        return false;
      }
    }

    // 標高フィルター (最大値)
    if (filters.maxElevation !== null) {
      if (!spot.elevation || spot.elevation > filters.maxElevation) {
        return false;
      }
    }

    return true;
  });
}

/**
 * フィルターがアクティブかどうかを判定する関数
 */
export function hasActiveClientFilters(
  filters: ClientSideFilterValues
): boolean {
  return (
    filters.pricingFilter !== 'all' ||
    filters.minSecurityLevel > 0 ||
    filters.minQuietnessLevel > 0 ||
    filters.maxToiletDistance !== null ||
    filters.minElevation !== null ||
    filters.maxElevation !== null
  );
}
