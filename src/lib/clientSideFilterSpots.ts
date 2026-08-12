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
  filters: ClientSideFilterValues,
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
        spot.distanceToToilet == null ||
        spot.distanceToToilet > filters.maxToiletDistance
      ) {
        return false;
      }
    }

    // コンビニまでの距離フィルター
    if (filters.maxConvenienceDistance !== null) {
      if (
        spot.distanceToConvenience == null ||
        spot.distanceToConvenience > filters.maxConvenienceDistance
      ) {
        return false;
      }
    }

    // 入浴施設までの距離フィルター
    if (filters.maxBathDistance !== null) {
      if (
        spot.distanceToBath == null ||
        spot.distanceToBath > filters.maxBathDistance
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

    // 標高フィルター (最大値、未満で判定)
    if (filters.maxElevation !== null) {
      if (!spot.elevation || spot.elevation >= filters.maxElevation) {
        return false;
      }
    }

    // 車高フィルター
    // - noHeightLimit: 制限なし → 常に表示
    // - maxVehicleHeight(数値): 自車高未満なら除外（入れない）
    // - どちらもなし(不明): includeUnknownHeight が false のとき除外
    if (filters.vehicleHeight != null) {
      if (spot.noHeightLimit) {
        // 制限なし → 表示
      } else if (spot.maxVehicleHeight != null) {
        if (spot.maxVehicleHeight < filters.vehicleHeight) {
          return false;
        }
      } else if (filters.includeUnknownHeight === false) {
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
  filters: ClientSideFilterValues,
): boolean {
  return (
    filters.pricingFilter !== 'all' ||
    filters.minSecurityLevel > 0 ||
    filters.minQuietnessLevel > 0 ||
    filters.maxToiletDistance !== null ||
    filters.maxConvenienceDistance !== null ||
    filters.maxBathDistance !== null ||
    filters.minElevation !== null ||
    filters.maxElevation !== null ||
    filters.vehicleHeight != null
  );
}
