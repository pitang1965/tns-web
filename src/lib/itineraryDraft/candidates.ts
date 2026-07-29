import CampingSpot, { ICampingSpot } from '@/lib/models/CampingSpot';
import {
  CampingSpotType,
  CampingSpotTypeLabels,
} from '@/data/schemas/campingSpot';
import { PersonaType } from '@/data/schemas/diagnosisSchema';
import { PERSONAS } from '@/lib/diagnosisScoring';
import { haversineKm, pointAtFraction, pointToPolylineKm } from './geo';
import { CANDIDATES_PER_NIGHT, CORRIDOR_BUFFER_KM, CandidateSpot, LatLng } from './types';

/**
 * 車高・全長から泊まれないスポット種別を除外する（診断ロジックと同じ規則）。
 * diagnosisScoring.getExcludedSpotTypes は DiagnosisAnswer を要するため、
 * ここでは真偽値から同じ判定を再現する。
 */
export function getExcludedTypesFromCar(
  carHeightOver21m?: boolean,
  carLengthOver5m?: boolean,
): CampingSpotType[] {
  const excluded = new Set<CampingSpotType>();
  if (carHeightOver21m) excluded.add('parking_lot');
  if (carLengthOver5m) {
    excluded.add('parking_lot');
    excluded.add('convenience_store');
  }
  return Array.from(excluded);
}

function personaPreferredTypes(persona: PersonaType): string[] {
  return PERSONAS[persona]?.spotTypes ?? [];
}

/**
 * ある目標地点の周辺から、条件に合う実在スポットを候補として取得しランク付けする。
 * 「実在・到達可能・車で泊まれる・好み種別」をコード側で決定的に絞る（ADR-0008）。
 */
async function fetchCandidatesForTarget(
  target: LatLng,
  polyline: LatLng[],
  persona: PersonaType,
  excludedTypes: CampingSpotType[],
): Promise<CandidateSpot[]> {
  // 目標地点を中心にバウンディングボックスで粗く取得（既存 nearby API と同じ手法）
  const rangeM = CORRIDOR_BUFFER_KM * 1000;
  const latRange = rangeM / 111000;
  const lngRange = rangeM / (111000 * Math.cos((target.lat * Math.PI) / 180));

  const query: Record<string, unknown> = {
    coordinates: {
      $geoWithin: {
        $box: [
          [target.lng - lngRange, target.lat - latRange],
          [target.lng + lngRange, target.lat + latRange],
        ],
      },
    },
    isOvernightProhibited: { $ne: true },
  };
  if (excludedTypes.length > 0) {
    query.type = { $nin: excludedTypes };
  }

  const spots = await CampingSpot.find(query).lean<ICampingSpot[]>();
  const preferred = personaPreferredTypes(persona);

  type Scored = { spot: ICampingSpot; distanceFromTargetKm: number; score: number };
  const scored: Scored[] = [];

  for (const spot of spots) {
    if (!Array.isArray(spot.coordinates) || spot.coordinates.length !== 2) {
      continue;
    }
    const loc: LatLng = { lat: spot.coordinates[1], lng: spot.coordinates[0] };

    // 回廊バッファ内かを最短距離で判定
    const corridorKm = pointToPolylineKm(loc, polyline);
    if (corridorKm > CORRIDOR_BUFFER_KM) continue;

    const distanceFromTargetKm = haversineKm(loc, target);

    // スコア: 好み種別のボーナス − 目標地点からの距離
    const prefIndex = preferred.indexOf(spot.type);
    const preferenceBonus =
      prefIndex >= 0 ? (preferred.length - prefIndex) * 10 : 0;
    const score = preferenceBonus - distanceFromTargetKm;

    scored.push({ spot, distanceFromTargetKm, score });
  }

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, CANDIDATES_PER_NIGHT).map(({ spot, distanceFromTargetKm }) => {
    const location: LatLng = {
      lat: spot.coordinates[1],
      lng: spot.coordinates[0],
    };
    const nearbyBath =
      Array.isArray(spot.nearbyBathCoordinates) &&
      spot.nearbyBathCoordinates.length === 2
        ? {
            lat: spot.nearbyBathCoordinates[1],
            lng: spot.nearbyBathCoordinates[0],
          }
        : undefined;

    return {
      spotId: String(spot._id),
      name: spot.name,
      type: spot.type,
      typeLabel: CampingSpotTypeLabels[spot.type as CampingSpotType] ?? spot.type,
      prefecture: spot.prefecture,
      isFree: spot.pricing?.isFree ?? false,
      pricePerNight: spot.pricing?.pricePerNight,
      hasPowerOutlet: spot.hasPowerOutlet ?? false,
      hasRoof: spot.hasRoof ?? false,
      isQuietArea: spot.nightNoise?.isQuietArea ?? false,
      distanceFromTargetKm: Math.round(distanceFromTargetKm * 10) / 10,
      location,
      address: spot.address ?? null,
      url: spot.url ?? null,
      nearbyBath,
    } satisfies CandidateSpot;
  });
}

/**
 * 各夜の泊地候補プールを作る。night k の目標地点は経路の割合
 * (k+1)/(nights+1) の位置に置く（走行日数 = nights+1 で均等配置）。
 * 返り値は長さ nights の配列（各要素がその夜の候補リスト）。
 */
export async function buildCandidatesByNight(
  polyline: LatLng[],
  numberOfNights: number,
  persona: PersonaType,
  excludedTypes: CampingSpotType[],
): Promise<CandidateSpot[][]> {
  const result: CandidateSpot[][] = [];
  for (let k = 0; k < numberOfNights; k++) {
    const fraction = (k + 1) / (numberOfNights + 1);
    const target = pointAtFraction(polyline, fraction);
    const candidates = await fetchCandidatesForTarget(
      target,
      polyline,
      persona,
      excludedTypes,
    );
    result.push(candidates);
  }
  return result;
}
