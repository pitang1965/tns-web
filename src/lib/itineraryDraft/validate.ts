import { randomUUID } from 'crypto';
import {
  ClientItineraryInput,
  clientItinerarySchema,
} from '@/data/schemas/itinerarySchema';
import { CampingSpotType } from '@/data/schemas/campingSpot';
import {
  CandidateSpot,
  GenerateDraftInput,
  LatLng,
  LlmActivity,
  LlmDraftOutput,
  PlaceType,
} from './types';
import { PLACE_TYPES } from './prompt';
import { geocodePlaceName, GeocodeResult } from './geocode';

type GeoResolver = (name: string) => Promise<GeocodeResult | null>;

/**
 * 候補id違反やスキーマ不整合など「LLMに1回だけ再試行させる価値がある」失敗。
 * これを投げると Server Action 側が修正指示付きで再生成する（ADR-0008）。
 */
export class DraftRetryableError extends Error {}

type Owner = { id: string; name: string; email: string };

// 車中泊スポット種別 → アクティビティの場所種別
function mapSpotTypeToPlaceType(type: CampingSpotType): PlaceType {
  switch (type) {
    case 'roadside_station':
      return 'PARKING_FREE_MICHINOEKI';
    case 'sa_pa':
      return 'PARKING_FREE_SERVICE_AREA';
    case 'rv_park':
      return 'PARKING_PAID_RV_PARK';
    case 'auto_campground':
      return 'PARKING_PAID_OTHER';
    case 'onsen_facility':
      return 'BATHING_FACILITY';
    case 'convenience_store':
      return 'CONVENIENCE_SUPERMARKET';
    case 'parking_lot':
      return 'PARKING_PAID_OTHER';
    default:
      return 'OTHER';
  }
}

function normalizePlaceType(type: string): PlaceType {
  return (PLACE_TYPES as string[]).includes(type)
    ? (type as PlaceType)
    : 'OTHER';
}

function dateForDay(startDate: string | undefined, i: number): string | null {
  if (!startDate) return null;
  const d = new Date(startDate);
  if (isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + i);
  return d.toISOString().split('T')[0];
}

function routeCentroid(input: GenerateDraftInput): LatLng {
  const pts = [
    input.startLocation.location,
    ...input.destinations.map((d) => d.location),
  ];
  const lat = pts.reduce((s, p) => s + p.lat, 0) / pts.length;
  const lng = pts.reduce((s, p) => s + p.lng, 0) / pts.length;
  return { lat, lng };
}

// LLM の日中アクティビティ → activitySchema 準拠のアクティビティ（座標は解決/ null）
async function buildDaytimeActivity(a: LlmActivity, resolveGeo: GeoResolver) {
  let location: { latitude: number; longitude: number } | null = null;
  let address: string | null = null;

  if (a.placeName && a.placeName.trim()) {
    const geo = await resolveGeo(a.placeName.trim());
    if (geo) {
      location = {
        latitude: geo.location.lat,
        longitude: geo.location.lng,
      };
      address = geo.address;
    }
  }

  return {
    id: randomUUID(),
    title: a.title,
    place: {
      name: a.placeName?.trim() || a.title,
      type: normalizePlaceType(a.type),
      address,
      location,
    },
    description: a.description ?? null,
    startTime: a.startTime ?? null,
    endTime: a.endTime ?? null,
    cost: null,
  };
}

// 候補（実在スポット）→ 泊地アクティビティ。値は DB の正データで作る（LLM出力は使わない）
function buildOvernightActivity(spot: CandidateSpot) {
  const priceText = spot.isFree
    ? '無料'
    : spot.pricePerNight != null
      ? `¥${spot.pricePerNight}`
      : '';
  return {
    id: randomUUID(),
    title: `車中泊: ${spot.name}`,
    place: {
      name: spot.name,
      type: mapSpotTypeToPlaceType(spot.type),
      address: spot.address ?? null,
      location: {
        latitude: spot.location.lat,
        longitude: spot.location.lng,
      },
    },
    description: `泊地（${spot.typeLabel}${priceText ? `・${priceText}` : ''}）`,
    startTime: null,
    endTime: null,
    cost: spot.isFree ? 0 : (spot.pricePerNight ?? null),
    url: spot.url ?? undefined,
  };
}

/**
 * LLM出力を検証し、実在スポットの正データで泊地を確定し、観光地を座標解決して、
 * 最終的に clientItinerarySchema で検証した ClientItineraryInput を組み立てる（三重防御）。
 */
export async function buildDraftFromLlm(params: {
  llm: LlmDraftOutput;
  input: GenerateDraftInput;
  candidatesByDay: CandidateSpot[][];
  owner: Owner;
}): Promise<{ draft: ClientItineraryInput; notes: string[] }> {
  const { llm, input, candidatesByDay, owner } = params;
  const numberOfDays = candidatesByDay.length;
  const notes: string[] = [];

  if (!Array.isArray(llm.days) || llm.days.length !== numberOfDays) {
    throw new DraftRetryableError(
      `days の要素数は ${numberOfDays} にしてください（受信: ${llm.days?.length ?? 0}）`,
    );
  }

  const proximity = routeCentroid(input);

  // 同一リクエスト内での同名クエリの重複排除（LLMが同じ地名を複数回出すため）
  const geoCache = new Map<string, Promise<GeocodeResult | null>>();
  const resolveGeo: GeoResolver = (name) => {
    let p = geoCache.get(name);
    if (!p) {
      p = geocodePlaceName(name, proximity);
      geoCache.set(name, p);
    }
    return p;
  };

  const dayPlans = [];

  for (let i = 0; i < numberOfDays; i++) {
    const candidates = candidatesByDay[i];
    const llmDay = llm.days[i];

    // 日中アクティビティを座標解決しつつ構築（その日の分は並列で解決して短縮）
    const activities: Array<
      | Awaited<ReturnType<typeof buildDaytimeActivity>>
      | ReturnType<typeof buildOvernightActivity>
    > = await Promise.all(
      (llmDay.activities ?? []).map((a) => buildDaytimeActivity(a, resolveGeo)),
    );

    // 泊地の確定（ハルシネーション防止の要）
    if (candidates.length > 0) {
      const chosenId = llmDay.chosenSpotId;
      if (!chosenId) {
        throw new DraftRetryableError(
          `${i + 1}日目は候補があるので chosenSpotId を候補から選んでください`,
        );
      }
      const spot = candidates.find((c) => c.spotId === chosenId);
      if (!spot) {
        throw new DraftRetryableError(
          `${i + 1}日目の chosenSpotId "${chosenId}" は候補に存在しません。候補の spotId から選んでください`,
        );
      }
      activities.push(buildOvernightActivity(spot));
    } else if (i < numberOfDays - 1) {
      // 最終日以外で候補ゼロ = 部分成立（ADR-0008 の段階緩和の最後の受け皿）
      notes.push(
        `${i + 1}日目は条件に合う車中泊スポットが見つかりませんでした。手動で泊地を追加してください。`,
      );
    }

    dayPlans.push({
      date: dateForDay(input.startDate, i),
      activities,
      notes: '',
    });
  }

  const candidate = {
    title: input.title?.trim() || llm.title || '車旅の旅程',
    description: llm.description ?? '',
    numberOfDays,
    startDate: input.startDate,
    dayPlans,
    owner,
    isPublic: false,
    sharedWith: [],
  };

  // 三重防御の最終段: 既存の Zod スキーマで全体を検証する
  const parsed = clientItinerarySchema.safeParse(candidate);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new DraftRetryableError(
      `出力がスキーマに適合しませんでした: ${first?.path?.join('.') ?? ''} ${first?.message ?? ''}`.trim(),
    );
  }

  return { draft: parsed.data as ClientItineraryInput, notes };
}
