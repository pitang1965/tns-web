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
import {
  buildPolyline,
  haversineKm,
  pointToPolylineKm,
  routeBoundingBox,
} from './geo';
import { draftLog } from './debug';

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

/**
 * 場所名からタイプを推定する。編集画面の useAutoSetPlaceType と同じキーワード規則
 * （順序も一致）を生成時に先取りして適用するための純粋関数。
 *
 * 目的: 生成物の type を OTHER/ATTRACTION 以外の具体値にしておくことで、編集画面
 * ロード時に useAutoSetPlaceType が再発火（shouldValidate 付き setValue）して
 * 保存がブロックされる問題を防ぐ。キーワードに合致しなければ null を返す。
 */
function inferPlaceTypeFromName(name: string): PlaceType | null {
  if (name.includes('自宅')) return 'HOME';
  if (name.includes('RVパーク')) return 'PARKING_PAID_RV_PARK';
  if (name.includes('SA') || name.includes('PA'))
    return 'PARKING_FREE_SERVICE_AREA';
  if (name.includes('道の駅')) return 'PARKING_FREE_MICHINOEKI';
  if (name.includes('コンビニ') || name.includes('スーパー'))
    return 'CONVENIENCE_SUPERMARKET';
  if (name.includes('ガソリン') || name.includes('GS')) return 'GAS_STATION';
  if (name.includes('コインランドリー')) return 'COIN_LAUNDRY';
  if (
    name.includes('温泉') ||
    name.includes('銭湯') ||
    name.includes('入浴') ||
    name.includes('風呂')
  )
    return 'BATHING_FACILITY';
  if (name.includes('ホテル') || name.includes('旅館') || name.includes('民宿'))
    return 'HOTEL';
  if (name.includes('レストラン') || name.includes('食堂')) return 'RESTAURANT';
  if (name.includes('駐車場') || name.includes('パーキング'))
    return 'PARKING_PAID_OTHER';
  return null;
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

  const name = a.placeName?.trim() || a.title;
  // 名前からの推定を優先し（編集画面の自動タイプ設定の再発火を防ぐ）、
  // 合致しなければ LLM の type を採用する。ただし HOME(自宅) は名前に「自宅」を
  // 含む場合のみ許可する（出発地が自宅とは限らず、HOMEは座標・住所が非公開扱いになるため）。
  const type =
    inferPlaceTypeFromName(name) ??
    (a.type === 'HOME' ? 'OTHER' : normalizePlaceType(a.type));

  return {
    id: randomUUID(),
    title: a.title,
    place: {
      name,
      type,
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

// 出発地の構造アンカー（出発/帰着）を作る（ADR-0008 追記の方式Q）。
// 身元（名称・座標）は出発地の確定値で作り、時刻のみ引数で受ける
// （＝身元はコード所有・時刻はLLM由来）。値の形は buildDaytimeActivity と揃える。
function buildStartAnchor(
  input: GenerateDraftInput,
  kind: 'depart' | 'return',
  startTime: string | null,
) {
  const name = input.startLocation.name;
  return {
    id: randomUUID(),
    title: `${kind === 'depart' ? '出発' : '帰着'}: ${name}`,
    place: {
      name,
      type: inferPlaceTypeFromName(name) ?? 'OTHER',
      address: input.startLocation.address ?? null,
      location: {
        latitude: input.startLocation.location.lat,
        longitude: input.startLocation.location.lng,
      },
    },
    description: null,
    startTime: startTime ?? null,
    endTime: null,
    cost: null,
  };
}

// あるアクティビティが「出発地そのもの」を指すか。名称一致（出発地名を含む）または
// 座標が出発地に近接（〜0.5km）で判定する。出発地はユーザー確定値なので判定が明快で、
// 近隣の別スポット（温泉など）を巻き込まない。
function isStartLocationActivity(
  act: {
    place: {
      name: string;
      location: { latitude: number; longitude: number } | null;
    };
  },
  input: GenerateDraftInput,
): boolean {
  const startName = input.startLocation.name.trim();
  const name = act.place.name?.trim() ?? '';
  if (startName && name && (name === startName || name.includes(startName))) {
    return true;
  }
  if (act.place.location) {
    const km = haversineKm(
      {
        lat: act.place.location.latitude,
        lng: act.place.location.longitude,
      },
      input.startLocation.location,
    );
    if (km < 0.5) return true;
  }
  return false;
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

  // 経路の折れ線と境界ボックス（誤ジオコーディング対策に使う）
  const polyline = buildPolyline(
    input.startLocation.location,
    input.destinations.map((d) => d.location),
    input.roundTrip,
  );
  const bbox = routeBoundingBox(polyline, 50) ?? undefined;
  const MAX_OFFROUTE_KM = 100;

  // 同一リクエスト内での同名クエリの重複排除（LLMが同じ地名を複数回出すため）
  const geoCache = new Map<string, Promise<GeocodeResult | null>>();
  const resolveGeo: GeoResolver = (name) => {
    let p = geoCache.get(name);
    if (!p) {
      p = geocodePlaceName(name, proximity, bbox).then((geo) => {
        // 経路から遠すぎる結果は同名施設の誤マッチとみなして棄却
        // （例: 栃木の「城の湯」を頼んだら熊本の同名施設が返る、を防ぐ）
        if (
          geo &&
          pointToPolylineKm(geo.location, polyline) > MAX_OFFROUTE_KM
        ) {
          draftLog('geocode-offroute-rejected', {
            name,
            km: Math.round(pointToPolylineKm(geo.location, polyline)),
          });
          return null;
        }
        return geo;
      });
      geoCache.set(name, p);
    }
    return p;
  };

  const dayPlans = [];

  const asLoc = (p: LatLng) => ({ latitude: p.lat, longitude: p.lng });
  // その日の出発元。1日目は出発地、以降は前夜の泊地。
  let departFromLoc: LatLng = input.startLocation.location;

  for (let i = 0; i < numberOfDays; i++) {
    const candidates = candidatesByDay[i];
    const llmDay = llm.days[i];
    const isLastDay = i === numberOfDays - 1;

    // 日中アクティビティを座標解決しつつ構築（その日の分は並列で解決して短縮）
    let activities: Array<
      | Awaited<ReturnType<typeof buildDaytimeActivity>>
      | ReturnType<typeof buildOvernightActivity>
    > = await Promise.all(
      (llmDay.activities ?? []).map((a) => buildDaytimeActivity(a, resolveGeo)),
    );

    // 2日目以降の先頭が「◯◯を出発」等で座標なしなら、前夜の泊地座標を与える。
    if (i > 0 && activities.length > 0 && activities[0].place.location === null) {
      activities[0].place.location = asLoc(departFromLoc);
    }

    // 構造アンカー（出発地）のコード所有（ADR-0008 追記）。
    // 「身元（存在・名称・座標）」はコードが確定し、時刻はLLMの表現から継承する。
    if (i === 0) {
      // ⓪ 1日目: 先頭に出発アンカーを保証（prepend）。LLMが出発を到着に畳み込んでも立つ。
      if (
        activities.length > 0 &&
        isStartLocationActivity(activities[0], input)
      ) {
        // LLMが出発地そのものを先頭に出していれば、時刻を保持して正規化する。
        activities[0] = buildStartAnchor(
          input,
          'depart',
          activities[0].startTime,
        );
      } else {
        const departTime = activities.length > 0 ? activities[0].startTime : null;
        activities.unshift(buildStartAnchor(input, 'depart', departTime));
      }
      // 先頭以外に出発地が重複したら除去（保険）。
      activities = activities.filter(
        (a, idx) => idx === 0 || !isStartLocationActivity(a, input),
      );
    } else if (isLastDay && input.roundTrip) {
      // ① 最終日・往復: 末尾に帰着アンカーを保証。LLMの帰着時刻があれば継承する。
      const last = activities[activities.length - 1];
      const returnTime =
        last && isStartLocationActivity(last, input)
          ? (last.startTime ?? last.endTime ?? null)
          : null;
      // 途中・末尾に出た出発地一致を一旦すべて除去し、正規の帰着を末尾に付ける。
      activities = activities.filter((a) => !isStartLocationActivity(a, input));
      activities.push(buildStartAnchor(input, 'return', returnTime));
    } else {
      // ④ 中日（および片道の最終日）: 途中に出た出発地一致を除去（帰着の早出しリーク対策）。
      activities = activities.filter((a) => !isStartLocationActivity(a, input));
    }

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
      // 翌日の出発元をこの夜の泊地にする
      departFromLoc = spot.location;
    } else if (!isLastDay) {
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
