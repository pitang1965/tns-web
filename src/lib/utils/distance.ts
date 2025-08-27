/**
 * 2点間の距離を計算するユーティリティ関数
 * Haversine公式を使用して地球上の2点間の直線距離を計算
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Haversine公式を使用して2点間の距離（メートル）を計算
 * @param point1 最初の地点の座標
 * @param point2 2番目の地点の座標
 * @returns 距離（メートル）
 */
export function calculateDistance(
  point1: Coordinates,
  point2: Coordinates
): number {
  const R = 6371000; // 地球の半径（メートル）

  // 度をラジアンに変換
  const lat1Rad = (point1.lat * Math.PI) / 180;
  const lat2Rad = (point2.lat * Math.PI) / 180;
  const deltaLatRad = ((point2.lat - point1.lat) * Math.PI) / 180;
  const deltaLngRad = ((point2.lng - point1.lng) * Math.PI) / 180;

  // Haversine公式
  const a =
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLngRad / 2) *
      Math.sin(deltaLngRad / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;

  return Math.round(distance); // 整数で返す
}

/**
 * 座標のペアから距離を計算（座標配列形式 [lng, lat]）
 * @param coords1 最初の地点の座標 [経度, 緯度]
 * @param coords2 2番目の地点の座標 [経度, 緯度]
 * @returns 距離（メートル）
 */
export function calculateDistanceFromCoordinates(
  coords1: [number, number],
  coords2: [number, number]
): number {
  const point1: Coordinates = { lng: coords1[0], lat: coords1[1] };
  const point2: Coordinates = { lng: coords2[0], lat: coords2[1] };

  return calculateDistance(point1, point2);
}

/**
 * 文字列形式の座標から距離を計算
 * @param lat1 最初の地点の緯度（文字列）
 * @param lng1 最初の地点の経度（文字列）
 * @param lat2 2番目の地点の緯度（文字列）
 * @param lng2 2番目の地点の経度（文字列）
 * @returns 距離（メートル）、無効な座標の場合はnull
 */
export function calculateDistanceFromStrings(
  lat1: string,
  lng1: string,
  lat2: string,
  lng2: string
): number | null {
  const numLat1 = Number(lat1);
  const numLng1 = Number(lng1);
  const numLat2 = Number(lat2);
  const numLng2 = Number(lng2);

  // 全ての値が有効な数値であることを確認
  if (
    isNaN(numLat1) ||
    isNaN(numLng1) ||
    isNaN(numLat2) ||
    isNaN(numLng2) ||
    lat1.trim() === '' ||
    lng1.trim() === '' ||
    lat2.trim() === '' ||
    lng2.trim() === ''
  ) {
    return null;
  }

  // 座標の範囲チェック
  if (
    numLat1 < -90 ||
    numLat1 > 90 ||
    numLat2 < -90 ||
    numLat2 > 90 ||
    numLng1 < -180 ||
    numLng1 > 180 ||
    numLng2 < -180 ||
    numLng2 > 180
  ) {
    return null;
  }

  return calculateDistance(
    { lat: numLat1, lng: numLng1 },
    { lat: numLat2, lng: numLng2 }
  );
}
