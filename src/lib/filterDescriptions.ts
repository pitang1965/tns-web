import { CampingSpotTypeLabels } from '@/data/schemas/campingSpot';
import { ClientSideFilterValues } from '@/components/shachu-haku/ClientSideFilters';

/**
 * Generate human-readable descriptions of active filters
 * @param searchTerm - Search keyword
 * @param typeFilter - Selected spot type filter
 * @param clientFilters - Client-side filter values
 * @returns Array of filter description strings
 */
export function getActiveFilterDescriptions(
  searchTerm: string,
  typeFilter: string,
  clientFilters: ClientSideFilterValues
): string[] {
  const descriptions: string[] = [];

  // Search keyword
  if (searchTerm) {
    descriptions.push(`「${searchTerm}」`);
  }

  // Spot type filter
  if (typeFilter && typeFilter !== 'all') {
    const typeLabel =
      CampingSpotTypeLabels[typeFilter as keyof typeof CampingSpotTypeLabels];
    descriptions.push(`${typeLabel}のみ`);
  }

  // Client-side filters
  if (clientFilters.pricingFilter !== 'all') {
    const pricingLabels = {
      free: '無料のみ',
      paid: '有料のみ',
    };
    descriptions.push(pricingLabels[clientFilters.pricingFilter]);
  }

  if (clientFilters.minSecurityLevel > 0) {
    descriptions.push(
      `セキュリティレベル：${clientFilters.minSecurityLevel}以上`
    );
  }

  if (clientFilters.minQuietnessLevel > 0) {
    descriptions.push(`静かさレベル：${clientFilters.minQuietnessLevel}以上`);
  }

  if (clientFilters.maxToiletDistance !== null) {
    descriptions.push(
      `トイレまでの距離：${clientFilters.maxToiletDistance}m以内`
    );
  }

  if (
    clientFilters.minElevation !== null &&
    clientFilters.maxElevation !== null
  ) {
    descriptions.push(
      `標高：${clientFilters.minElevation}m〜${clientFilters.maxElevation}m`
    );
  } else if (clientFilters.minElevation !== null) {
    descriptions.push(`標高：${clientFilters.minElevation}m以上`);
  } else if (clientFilters.maxElevation !== null) {
    descriptions.push(`標高：${clientFilters.maxElevation}m以下`);
  }

  return descriptions;
}
