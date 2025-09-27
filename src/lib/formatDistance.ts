/**
 * 距離をメートル/キロメートル表記でフォーマットします
 * @param meters メートル単位の距離
 * @returns フォーマット済みの距離文字列
 *
 * @example
 * formatDistance(950)  // "950m"
 * formatDistance(1000) // "1km"
 * formatDistance(4500) // "4.5km"
 * formatDistance(4520) // "4.52km"
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters}m`;
  }

  const km = meters / 1000;

  // 小数点以下2桁まで表示し、末尾の0を削除
  return `${parseFloat(km.toFixed(2))}km`;
}