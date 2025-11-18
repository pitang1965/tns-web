/**
 * Camping Spot CSV Export/Import Utilities
 *
 * Handles CSV operations specific to camping spots
 */

import { CampingSpotWithId } from '@/data/schemas/campingSpot';
import { escapeCSVField, downloadCSV, generateCSVFilename } from './utils';

/**
 * CSV column headers for camping spots (English version)
 */
export const CAMPING_SPOT_CSV_HEADERS = [
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
] as const;

/**
 * CSV column headers for camping spots (Japanese version)
 */
export const CAMPING_SPOT_CSV_HEADERS_JP = [
  '名称',
  '緯度',
  '経度',
  '都道府県',
  '住所',
  'URL',
  'タイプ',
  'トイレまでの距離(m)',
  'お風呂までの距離(m)',
  'コンビニまでの距離(m)',
  'トイレ緯度',
  'トイレ経度',
  'コンビニ緯度',
  'コンビニ経度',
  'お風呂緯度',
  'お風呂経度',
  '標高(m)',
  'ゲート有無',
  '照明有無',
  'スタッフ有無',
  '騒音問題有無',
  '幹線道路近接',
  '静かなエリア',
  '屋根あり',
  '電源あり',
  'ゲート付き',
  '無料',
  '1泊料金',
  '料金備考',
  '収容台数',
  '大型車収容台数',
  '制限事項',
  '設備',
  '備考',
] as const;

/**
 * Convert a camping spot to a CSV row (array of field values)
 *
 * @param spot - Camping spot data
 * @returns Array of field values matching CAMPING_SPOT_CSV_HEADERS order
 */
export function campingSpotToCSVRow(spot: CampingSpotWithId): unknown[] {
  return [
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
}

/**
 * Export camping spots to CSV format
 *
 * @param spots - Array of camping spots to export
 * @returns Object with CSV content and statistics
 */
export function exportCampingSpotsToCSV(spots: CampingSpotWithId[]): {
  csvContent: string;
  processedCount: number;
  errorCount: number;
} {
  const csvRows = [CAMPING_SPOT_CSV_HEADERS.join(',')];
  let processedCount = 0;
  let errorCount = 0;

  spots.forEach((spot) => {
    try {
      const fields = campingSpotToCSVRow(spot);
      csvRows.push(fields.map(escapeCSVField).join(','));
      processedCount++;
    } catch (error) {
      console.error(`Error processing spot ${spot._id}:`, error);
      errorCount++;
    }
  });

  // Use \r\n for Windows compatibility and to avoid issues with quoted newlines
  const csvContent = csvRows.join('\r\n');

  return {
    csvContent,
    processedCount,
    errorCount,
  };
}

/**
 * Download camping spots as CSV file
 *
 * @param spots - Array of camping spots to export
 */
export function downloadCampingSpotsCSV(spots: CampingSpotWithId[]): void {
  const { csvContent } = exportCampingSpotsToCSV(spots);
  const filename = generateCSVFilename('shachu-haku-spots');
  downloadCSV(csvContent, filename);
}

/**
 * Generate CSV template for camping spot import
 *
 * @returns CSV template with headers and sample data
 */
export function generateCampingSpotTemplate(): string {
  const headers = CAMPING_SPOT_CSV_HEADERS_JP;

  const sampleData = [
    '道の駅サンプル', // 名称
    '35.6762', // 緯度
    '139.6503', // 経度
    '東京都', // 都道府県
    '東京都千代田区', // 住所
    '', // URL - 任意
    'roadside_station', // タイプ
    '', // トイレまでの距離(m) - 任意
    '', // お風呂までの距離(m) - 任意
    '', // コンビニまでの距離(m) - 任意
    '', // トイレ緯度 - 任意
    '', // トイレ経度 - 任意
    '', // コンビニ緯度 - 任意
    '', // コンビニ経度 - 任意
    '', // お風呂緯度 - 任意
    '', // お風呂経度 - 任意
    '', // 標高(m) - 任意
    'false', // ゲート有無
    'true', // 照明有無
    'false', // スタッフ有無
    'false', // 騒音問題有無
    'false', // 幹線道路近接
    'true', // 静かなエリア
    'true', // 屋根あり
    'false', // 電源あり
    'false', // ゲート付き
    'true', // 無料
    '', // 1泊料金
    '', // 料金備考
    '', // 収容台数 - 任意
    '', // 大型車収容台数 - 任意
    '大型車不可', // 制限事項
    'トイレ,自販機', // 設備
    '', // 備考 - 任意
  ];

  return [headers.join(','), sampleData.join(',')].join('\n');
}

/**
 * Download camping spot import template
 */
export function downloadCampingSpotTemplate(): void {
  const csvContent = generateCampingSpotTemplate();
  downloadCSV(csvContent, 'camping-spots-template.csv');
}
