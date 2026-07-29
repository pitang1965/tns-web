import { DETOUR_FACTOR, FEASIBILITY_TOLERANCE, LatLng } from './types';
import { buildPolyline, totalPolylineKm } from './geo';

export type FeasibilityResult = {
  feasible: boolean;
  totalDrivingKm: number; // 直線距離×回り道係数の推定走行距離
  perDayKm: number; // 1日あたりの推定走行距離
  message?: string; // 実現不可能な場合の説明
};

/**
 * LLM を呼ぶ前に、コードだけで実現可能性を判定する（ADR-0008 / ADR-0009）。
 * 総経路距離 ÷ 走行日数 が 1日の走行距離目安を大きく超える入力は、ここで弾く。
 * 走行日数 = 泊数 + 1（例: 3泊なら4日運転する）。
 */
export function checkFeasibility(params: {
  start: LatLng;
  destinations: LatLng[];
  numberOfNights: number;
  dailyDistanceKm: number;
  roundTrip: boolean;
}): FeasibilityResult {
  const { start, destinations, numberOfNights, dailyDistanceKm, roundTrip } =
    params;

  const polyline = buildPolyline(start, destinations, roundTrip);
  const totalDrivingKm = totalPolylineKm(polyline) * DETOUR_FACTOR;
  const drivingDays = numberOfNights + 1;
  const perDayKm = totalDrivingKm / drivingDays;

  if (perDayKm > dailyDistanceKm * FEASIBILITY_TOLERANCE) {
    const suggestedNights = Math.max(
      1,
      Math.ceil(totalDrivingKm / dailyDistanceKm) - 1,
    );
    return {
      feasible: false,
      totalDrivingKm,
      perDayKm,
      message:
        `推定走行距離は約${Math.round(totalDrivingKm)}kmで、` +
        `${drivingDays}日で走ると1日あたり約${Math.round(perDayKm)}kmになります。` +
        `1日${dailyDistanceKm}kmの目安を超えています。` +
        `泊数を${suggestedNights}泊以上に増やす、1日の走行距離を増やす、` +
        `または目的地を減らすことを検討してください。`,
    };
  }

  return { feasible: true, totalDrivingKm, perDayKm };
}
