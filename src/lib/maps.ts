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
