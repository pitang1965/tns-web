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
 * formatDistance(118.74) // "119m"
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }

  const km = meters / 1000;

  // 小数点以下2桁まで表示し、末尾の0を削除
  return `${parseFloat(km.toFixed(2))}km`;
}

/**
 * 施設までの距離をフォーマットします
 * 距離0mの場合は「敷地内にあり」と表示します
 * @param distance メートル単位の距離（null/undefinedの場合は「不明」）
 * @returns フォーマット済みの距離文字列
 *
 * @example
 * formatFacilityDistance(0)    // "敷地内にあり"
 * formatFacilityDistance(50)   // "約50m"
 * formatFacilityDistance(1200) // "約1.2km"
 * formatFacilityDistance(null) // "不明"
 * formatFacilityDistance(undefined) // "不明"
 */
export function formatFacilityDistance(
  distance: number | null | undefined
): string {
  if (distance === 0) {
    return '敷地内にあり';
  }
  if (distance && distance > 0) {
    return `約${formatDistance(distance)}`;
  }
  return '不明';
}