import { calculateDistance } from '@/lib/utils/distance';
import { LatLng } from './types';

/**
 * 2点間の直線距離（km）。既存の Haversine 実装（メートル）を km に変換して使う。
 */
export function haversineKm(a: LatLng, b: LatLng): number {
  return calculateDistance(a.lat, a.lng, b.lat, b.lng) / 1000;
}

/**
 * 折れ線（ウェイポイント列）の総直線距離（km）。回り道係数は掛けない生の値。
 */
export function totalPolylineKm(polyline: LatLng[]): number {
  let sum = 0;
  for (let i = 1; i < polyline.length; i++) {
    sum += haversineKm(polyline[i - 1], polyline[i]);
  }
  return sum;
}

/**
 * 折れ線上で、全長に対する割合 f (0..1) の位置にある点を返す。
 * その日の泊地の「目標地点」を経路上に配置するために使う。
 */
export function pointAtFraction(polyline: LatLng[], f: number): LatLng {
  if (polyline.length === 0) throw new Error('empty polyline');
  if (polyline.length === 1) return polyline[0];

  const total = totalPolylineKm(polyline);
  if (total === 0) return polyline[0];

  const targetKm = Math.max(0, Math.min(1, f)) * total;
  let acc = 0;
  for (let i = 1; i < polyline.length; i++) {
    const legKm = haversineKm(polyline[i - 1], polyline[i]);
    if (acc + legKm >= targetKm) {
      const t = legKm === 0 ? 0 : (targetKm - acc) / legKm;
      return {
        lat: polyline[i - 1].lat + (polyline[i].lat - polyline[i - 1].lat) * t,
        lng: polyline[i - 1].lng + (polyline[i].lng - polyline[i - 1].lng) * t,
      };
    }
    acc += legKm;
  }
  return polyline[polyline.length - 1];
}

// 局所平面近似（equirectangular）でメートルに投影する。
// これくらいの距離（数百km以内）なら点対線分距離の判定には十分な精度。
function toMeters(p: LatLng, refLat: number): { x: number; y: number } {
  const R = 6371000;
  const rad = Math.PI / 180;
  return {
    x: p.lng * rad * Math.cos(refLat * rad) * R,
    y: p.lat * rad * R,
  };
}

/**
 * 点 p から線分 a-b までの最短距離（km）。
 */
function pointToSegmentKm(p: LatLng, a: LatLng, b: LatLng): number {
  const refLat = a.lat;
  const pm = toMeters(p, refLat);
  const am = toMeters(a, refLat);
  const bm = toMeters(b, refLat);

  const dx = bm.x - am.x;
  const dy = bm.y - am.y;
  const lenSq = dx * dx + dy * dy;

  let t = 0;
  if (lenSq > 0) {
    t = ((pm.x - am.x) * dx + (pm.y - am.y) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
  }
  const cx = am.x + t * dx;
  const cy = am.y + t * dy;
  const distM = Math.hypot(pm.x - cx, pm.y - cy);
  return distM / 1000;
}

/**
 * 点から折れ線全体までの最短距離（km）。回廊バッファ判定に使う。
 */
export function pointToPolylineKm(p: LatLng, polyline: LatLng[]): number {
  if (polyline.length === 0) return Infinity;
  if (polyline.length === 1) return haversineKm(p, polyline[0]);

  let min = Infinity;
  for (let i = 1; i < polyline.length; i++) {
    const d = pointToSegmentKm(p, polyline[i - 1], polyline[i]);
    if (d < min) min = d;
  }
  return min;
}

/**
 * 入力から経路の折れ線（ウェイポイント列）を組み立てる。
 * 往復なら末尾に出発地を追加する。
 */
export function buildPolyline(
  start: LatLng,
  destinations: LatLng[],
  roundTrip: boolean,
): LatLng[] {
  const points = [start, ...destinations];
  if (roundTrip) points.push(start);
  return points;
}
