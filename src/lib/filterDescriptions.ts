import { ClientSideFilterValues } from '@/components/shachu-haku/ClientSideFilters';
import { spotTypesToLabel } from '@/lib/spotTypeFilter';

/**
 * Generate human-readable descriptions of active filters
 * @param searchTerm - Search keyword
 * @param typeFilter - Selected spot type filters (empty = all types)
 * @param clientFilters - Client-side filter values
 * @returns Array of filter description strings
 */
export function getActiveFilterDescriptions(
  searchTerm: string,
  typeFilter: string[],
  clientFilters: ClientSideFilterValues,
): string[] {
  const descriptions: string[] = [];

  // Search keyword
  if (searchTerm) {
    descriptions.push(`「${searchTerm}」`);
  }

  // Spot type filter（複数選択。空配列＝全種別）
  const typeLabel = spotTypesToLabel(typeFilter);
  if (typeLabel) {
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
      `セキュリティレベル：${clientFilters.minSecurityLevel}以上`,
    );
  }

  if (clientFilters.minQuietnessLevel > 0) {
    descriptions.push(`静かさレベル：${clientFilters.minQuietnessLevel}以上`);
  }

  if (clientFilters.maxToiletDistance !== null) {
    descriptions.push(
      `トイレまでの距離：${clientFilters.maxToiletDistance}m以内`,
    );
  }

  if (clientFilters.maxConvenienceDistance !== null) {
    descriptions.push(
      `コンビニまでの距離：${clientFilters.maxConvenienceDistance}m以内`,
    );
  }

  if (clientFilters.maxBathDistance !== null) {
    descriptions.push(
      `入浴施設までの距離：${clientFilters.maxBathDistance}m以内`,
    );
  }

  if (
    clientFilters.minElevation !== null &&
    clientFilters.maxElevation !== null
  ) {
    descriptions.push(
      `標高：${clientFilters.minElevation}m〜${clientFilters.maxElevation}m`,
    );
  } else if (clientFilters.minElevation !== null) {
    descriptions.push(`標高：${clientFilters.minElevation}m以上`);
  } else if (clientFilters.maxElevation !== null) {
    descriptions.push(`標高：${clientFilters.maxElevation}m未満`);
  }

  return descriptions;
}
