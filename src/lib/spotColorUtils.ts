/**
 * 車中泊スポットの表示色を管理するユーティリティ関数
 */

/**
 * スポットタイプごとの色分け
 */
export const getTypeColor = (type: string): string => {
  switch (type) {
    case 'roadside_station':
      return 'bg-blue-700 hover:bg-blue-800';
    case 'sa_pa':
      return 'bg-purple-700 hover:bg-purple-800';
    case 'rv_park':
      return 'bg-emerald-700 hover:bg-emerald-800';
    case 'convenience_store':
      return 'bg-cyan-700 hover:bg-cyan-800';
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
  if (rating >= 5) return 'bg-green-700 hover:bg-green-800';
  if (rating >= 4) return 'bg-blue-700 hover:bg-blue-800';
  if (rating >= 3) return 'bg-amber-700 hover:bg-amber-800';
  if (rating >= 2) return 'bg-orange-700 hover:bg-orange-800';
  return 'bg-red-700 hover:bg-red-800';
};

/**
 * 料金レベルごとの色分け
 */
export const getPricingColor = (
  isFree: boolean,
  pricePerNight?: number
): string => {
  if (isFree) return 'bg-green-700 hover:bg-green-800'; // 無料：緑色
  if (!pricePerNight) return 'bg-gray-500 hover:bg-gray-600'; // 料金未設定：グレー
  if (pricePerNight <= 1000) return 'bg-amber-700 hover:bg-amber-800'; // 1000円以下：琥珀色
  if (pricePerNight <= 2000) return 'bg-orange-700 hover:bg-orange-800'; // 1001-2000円：オレンジ色
  return 'bg-red-700 hover:bg-red-800'; // 2001円以上：赤色
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
