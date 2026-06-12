/**
 * Itinerary CSV Export/Import Utilities
 *
 * CSV format: one row per activity. Days without activities are exported as
 * a single row with empty activity columns so that day dates/notes survive a
 * roundtrip. Itinerary-level fields are repeated on every row; on import they
 * are read from the first row of each itinerary group (grouped by
 * 所有者ID + 旅程タイトル). Owner columns allow the admin import to restore
 * itineraries to their original owners.
 */

import { ClientItineraryDocument } from '@/data/schemas/itinerarySchema';
import { escapeCSVField, downloadCSV, generateCSVFilename } from './utils';

/**
 * CSV column headers for itineraries (Japanese)
 */
export const ITINERARY_CSV_HEADERS_JP = [
  '旅程タイトル',
  '旅程説明',
  '日数',
  '開始日',
  '公開',
  '所有者ID',
  '所有者名',
  '所有者メール',
  '日番号',
  '日付',
  '日メモ',
  'アクティビティ番号',
  'アクティビティ名',
  '場所名',
  '場所タイプ',
  '住所',
  '緯度',
  '経度',
  'アクティビティ説明',
  '開始時刻',
  '終了時刻',
  '費用',
  'URL',
] as const;

/**
 * Convert a single itinerary to CSV rows (one row per activity,
 * or one row per day when the day has no activities)
 *
 * @param itinerary - Itinerary data
 * @returns Array of rows matching ITINERARY_CSV_HEADERS_JP order
 */
export function itineraryToCSVRows(
  itinerary: ClientItineraryDocument,
): unknown[][] {
  const rows: unknown[][] = [];
  const base = [
    itinerary.title,
    itinerary.description || '',
    itinerary.numberOfDays,
    itinerary.startDate || '',
    itinerary.isPublic ? 'true' : 'false',
    itinerary.owner?.id || '',
    itinerary.owner?.name || '',
    itinerary.owner?.email || '',
  ];

  itinerary.dayPlans.forEach((day, dayIndex) => {
    const dayBase = [...base, dayIndex + 1, day.date || '', day.notes || ''];

    if (day.activities.length === 0) {
      // Keep one row per empty day so its date/notes survive a roundtrip
      rows.push([...dayBase, '', '', '', '', '', '', '', '', '', '', '', '']);
      return;
    }

    day.activities.forEach((activity, activityIndex) => {
      rows.push([
        ...dayBase,
        activityIndex + 1,
        activity.title,
        activity.place?.name || '',
        activity.place?.type || '',
        activity.place?.address || '',
        activity.place?.location?.latitude ?? '',
        activity.place?.location?.longitude ?? '',
        activity.description || '',
        activity.startTime || '',
        activity.endTime || '',
        activity.cost ?? '',
        activity.url || '',
      ]);
    });
  });

  return rows;
}

/**
 * Export itineraries to CSV format
 *
 * @param itineraries - Array of itineraries to export
 * @returns Object with CSV content and statistics
 */
export function exportItinerariesToCSV(
  itineraries: ClientItineraryDocument[],
): {
  csvContent: string;
  processedCount: number;
  errorCount: number;
} {
  const csvRows = [ITINERARY_CSV_HEADERS_JP.join(',')];
  let processedCount = 0;
  let errorCount = 0;

  itineraries.forEach((itinerary) => {
    try {
      itineraryToCSVRows(itinerary).forEach((fields) => {
        csvRows.push(fields.map(escapeCSVField).join(','));
      });
      processedCount++;
    } catch (error) {
      console.error(`Error processing itinerary ${itinerary.id}:`, error);
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
 * Download itineraries as CSV file
 *
 * @param itineraries - Array of itineraries to export
 */
export function downloadItinerariesCSV(
  itineraries: ClientItineraryDocument[],
): void {
  const { csvContent } = exportItinerariesToCSV(itineraries);
  const filename = generateCSVFilename('itineraries');
  downloadCSV(csvContent, filename);
}

/**
 * Generate CSV template for itinerary import
 *
 * @returns CSV template with headers and sample data
 */
export function generateItineraryTemplate(): string {
  const headers = ITINERARY_CSV_HEADERS_JP;

  const sampleRows = [
    [
      'サンプル旅程', // 旅程タイトル
      '週末の車中泊旅', // 旅程説明
      '2', // 日数
      '2026-07-04', // 開始日 - 任意
      'false', // 公開
      '', // 所有者ID - 空の場合はインポート実行者
      '', // 所有者名 - 任意
      '', // 所有者メール - 所有者IDとセットで指定
      '1', // 日番号
      '2026-07-04', // 日付 - 任意
      '初日は早めに出発', // 日メモ - 任意
      '1', // アクティビティ番号
      '出発', // アクティビティ名
      '自宅', // 場所名
      'HOME', // 場所タイプ
      '', // 住所 - 任意
      '35.6762', // 緯度 - 任意
      '139.6503', // 経度 - 任意
      '', // アクティビティ説明 - 任意
      '08:00', // 開始時刻 - 任意
      '', // 終了時刻 - 任意
      '', // 費用 - 任意
      '', // URL - 任意
    ],
    [
      'サンプル旅程',
      '週末の車中泊旅',
      '2',
      '2026-07-04',
      'false',
      '',
      '',
      '',
      '1',
      '2026-07-04',
      '初日は早めに出発',
      '2',
      '休憩',
      '道の駅サンプル',
      'PARKING_FREE_MICHINOEKI',
      '東京都千代田区',
      '35.6800',
      '139.7000',
      'トイレ休憩',
      '10:00',
      '10:30',
      '0',
      '',
    ],
    // Day 2 has no activities yet - activity columns are left empty
    [
      'サンプル旅程',
      '週末の車中泊旅',
      '2',
      '2026-07-04',
      'false',
      '',
      '',
      '',
      '2',
      '2026-07-05',
      '2日目は未定',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
    ],
  ];

  return [
    headers.join(','),
    ...sampleRows.map((row) => row.map(escapeCSVField).join(',')),
  ].join('\n');
}

/**
 * Download itinerary import template
 */
export function downloadItineraryTemplate(): void {
  const csvContent = generateItineraryTemplate();
  downloadCSV(csvContent, 'itineraries-template.csv');
}
