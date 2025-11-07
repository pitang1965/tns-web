/**
 * 車中泊スポットの表示色を管理するユーティリティ関数
 */

/**
 * スポットタイプごとの色分け
 */
export const getTypeColor = (type: string): string => {
  switch (type) {
    case 'roadside_station':
      return 'bg-blue-600 hover:bg-blue-700';
    case 'sa_pa':
      return 'bg-purple-600 hover:bg-purple-700';
    case 'rv_park':
      return 'bg-emerald-600 hover:bg-emerald-700';
    case 'convenience_store':
      return 'bg-cyan-600 hover:bg-cyan-700';
    case 'parking_lot':
      return 'bg-slate-600 hover:bg-slate-700';
    case 'other':
      return 'bg-gray-600 hover:bg-gray-700';
    default:
      return 'bg-gray-500 hover:bg-gray-600';
  }
};

/**
 * 評価レベルごとの色分け（治安、静けさなど）
 */
export const getRatingColor = (rating: number): string => {
  if (rating >= 5) return 'bg-green-600 hover:bg-green-700';
  if (rating >= 4) return 'bg-blue-600 hover:bg-blue-700';
  if (rating >= 3) return 'bg-yellow-600 hover:bg-yellow-700';
  if (rating >= 2) return 'bg-orange-600 hover:bg-orange-700';
  return 'bg-red-600 hover:bg-red-700';
};

/**
 * 料金レベルごとの色分け
 */
export const getPricingColor = (
  isFree: boolean,
  pricePerNight?: number
): string => {
  if (isFree) return 'bg-green-500 hover:bg-green-600'; // 無料：緑色
  if (!pricePerNight) return 'bg-gray-500 hover:bg-gray-600'; // 料金未設定：グレー
  if (pricePerNight <= 1000) return 'bg-yellow-500 hover:bg-yellow-600'; // 1000円以下：黄色
  if (pricePerNight <= 2000) return 'bg-orange-500 hover:bg-orange-600'; // 1001-2000円：オレンジ色
  return 'bg-red-500 hover:bg-red-600'; // 2001円以上：赤色
};

/**
 * 地図マーカーの色（16進数）を治安レベルに基づいて取得
 */
export const getMarkerColorByRating = (rating: number): string => {
  if (rating >= 5) return '#22c55e'; // green
  if (rating >= 4) return '#3b82f6'; // blue
  if (rating >= 3) return '#f59e0b'; // yellow
  if (rating >= 2) return '#f97316'; // orange
  return '#ef4444'; // red
};
