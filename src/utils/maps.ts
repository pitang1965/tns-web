/**
 * Google Maps URLから緯度経度を抽出する
 * @param url Google Maps の URL
 * 　　例: https://www.google.co.jp/maps/place/%E9%B9%BF%E9%87%8E%E5%A4%A7%E4%BD%9B/@35.7293178,139.2806376,13.75z/data=!4m6!3m5!1s0x601923b73ce06b97:0xeaec411b2b5aeebe!8m2!3d35.746966!4d139.2628315!16s%2Fg%2F11ggbbgr_4?hl=ja&entry=ttu&g_ep=EgoyMDI1MDIwNS4xIKXMDSoASAFQAw%3D%3D
 * @returns 緯度経度の組、または null
 */

export function extractCoordinatesFromGoogleMapsUrl(url: string) {
  // ピンの位置を探す（!3dと!4dの後の数値）
  const pinCoords = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);

  if (pinCoords) {
    return {
      latitude: parseFloat(pinCoords[1]),
      longitude: parseFloat(pinCoords[2]),
    };
  }

  // 地図の中心位置を探す（/@の後の座標）
  const centerCoords = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);

  if (centerCoords) {
    return {
      latitude: parseFloat(centerCoords[1]),
      longitude: parseFloat(centerCoords[2]),
    };
  }

  return null;
}
