/**
 * Google Maps URLから緯度経度を抽出する
 * @param url Google Maps の URL
 * 　　例: https://www.google.co.jp/maps/place/%E9%B9%BF%E9%87%8E%E5%A4%A7%E4%BD%9B/@35.7293178,139.2806376,13.75z/data=!4m6!3m5!1s0x601923b73ce06b97:0xeaec411b2b5aeebe!8m2!3d35.746966!4d139.2628315!16s%2Fg%2F11ggbbgr_4?hl=ja&entry=ttu&g_ep=EgoyMDI1MDIwNS4xIKXMDSoASAFQAw%3D%3D
 * @returns 緯度経度の組、または null
 */

export function extractCoordinatesFromGoogleMapsUrl(input: string) {
  // ピンの位置を探す（!3dと!4dの後の数値）
  const pinCoords = input.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);

  if (pinCoords) {
    return {
      latitude: parseFloat(pinCoords[1]),
      longitude: parseFloat(pinCoords[2]),
    };
  }

  // 単純な緯度,経度形式の文字列から抽出を試みる
  // 例: "34.1948618,132.2084567"
  const simpleCoords = input.match(/^(-?\d+\.\d+),\s*(-?\d+\.\d+)$/);

  if (simpleCoords) {
    return {
      latitude: parseFloat(simpleCoords[1]),
      longitude: parseFloat(simpleCoords[2]),
    };
  }

  // 地図の中心位置を探す（/@の後の座標）
  const centerCoords = input.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);

  if (centerCoords) {
    return {
      latitude: parseFloat(centerCoords[1]),
      longitude: parseFloat(centerCoords[2]),
    };
  }

  return null;
}

/**
 * ズームレベルと中心座標から地図の境界を計算する
 * Mapboxのズームレベルに基づいて、おおよその境界を計算
 * @param center 中心座標 [longitude, latitude]
 * @param zoom ズームレベル
 * @returns 境界 { north, south, east, west }
 */
export function calculateBoundsFromZoomAndCenter(
  center: [number, number],
  zoom: number
): { north: number; south: number; east: number; west: number } {
  const [lng, lat] = center;

  // ズームレベルに基づいて、画面に表示される範囲を計算
  // Mapboxの場合、zoom 0 では全世界が表示され、zoom が 1 増えるごとに表示範囲が半分になる
  // 標準的な16:9のアスペクト比を想定
  const metersPerPixel = (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);

  // 一般的な地図の表示サイズ（600px height として計算）
  const mapHeightPixels = 600;
  const mapWidthPixels = 1000; // おおよその幅

  // メートル単位での表示範囲
  const latRangeMeters = metersPerPixel * mapHeightPixels;
  const lngRangeMeters = metersPerPixel * mapWidthPixels;

  // 緯度1度 ≈ 111,320メートル
  const latDegrees = latRangeMeters / 111320;

  // 経度1度の距離は緯度によって変わる
  const lngDegreesPerMeter = 1 / (111320 * Math.cos((lat * Math.PI) / 180));
  const lngDegrees = lngRangeMeters * lngDegreesPerMeter;

  return {
    north: Math.min(lat + latDegrees / 2, 46), // 日本の北限
    south: Math.max(lat - latDegrees / 2, 24), // 日本の南限
    east: Math.min(lng + lngDegrees / 2, 154), // 日本の東限
    west: Math.max(lng - lngDegrees / 2, 122), // 日本の西限
  };
}
