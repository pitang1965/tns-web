import { LatLng } from './types';
import { BBox } from './geo';
import { logger } from '@/lib/logger';
import { draftLog } from './debug';

export type GeocodeResult = {
  location: LatLng;
  address: string | null;
};

// Mapbox Search Box forward への同時リクエスト数を制限し、429（レート制限）を避ける。
const MAX_CONCURRENT = 4;
let active = 0;
const waiters: Array<() => void> = [];

async function acquire(): Promise<void> {
  if (active >= MAX_CONCURRENT) {
    await new Promise<void>((resolve) => waiters.push(resolve));
  }
  active++;
}

function release(): void {
  active--;
  const next = waiters.shift();
  if (next) next();
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * 場所名 → 座標の解決（サーバー側）。
 *
 * ADR-0008: LLM が提案した観光地・入浴施設等の場所名を、既存アプリが使う
 * Mapbox Search Box API の forward（一発解決）エンドポイントで座標化する。
 *
 * 誤ジオコーディング対策:
 * - bbox（経路の境界ボックス）で検索範囲を経路周辺に絞る（同名施設の遠方マッチを防ぐ）。
 * - 候補が得られなければ null を返す（推測で誤座標を置かない）。
 * - 経路からの距離ガードは呼び出し側（validate.ts）で最終判定する。
 *
 * @param proximity 経路周辺にバイアスをかける基準点（任意）
 * @param bbox 検索を絞る境界ボックス（任意）
 */
export async function geocodePlaceName(
  name: string,
  proximity?: LatLng,
  bbox?: BBox,
): Promise<GeocodeResult | null> {
  // サーバー用トークン(URL制限なし)を優先。無ければ公開トークンにフォールバック。
  const token =
    process.env.MAPBOX_SERVER_TOKEN ||
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  if (!token) {
    logger.warn(
      'MAPBOX_SERVER_TOKEN / NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN 未設定のためジオコーディングをスキップ',
    );
    return null;
  }

  const query = name.trim();
  if (!query) return null;

  const params = new URLSearchParams({
    q: query,
    country: 'JP',
    language: 'ja',
    limit: '1',
    access_token: token,
  });
  if (proximity) {
    params.set('proximity', `${proximity.lng},${proximity.lat}`);
  }
  if (bbox) {
    params.set(
      'bbox',
      `${bbox.minLng},${bbox.minLat},${bbox.maxLng},${bbox.maxLat}`,
    );
  }
  const url = `https://api.mapbox.com/search/searchbox/v1/forward?${params.toString()}`;

  await acquire();
  try {
    const t0 = Date.now();
    let res: Response | null = null;
    // 429（レート制限）は短い待機で最大2回まで再試行
    for (let attempt = 0; attempt < 3; attempt++) {
      res = await fetch(url);
      if (res.status !== 429) break;
      await sleep(300 * (attempt + 1));
    }

    if (!res || !res.ok) {
      logger.warn(
        `ジオコーディング失敗: ${name} (status ${res?.status ?? 'n/a'})`,
      );
      draftLog('geocode', {
        name,
        status: res?.status ?? 0,
        ms: Date.now() - t0,
        hit: false,
      });
      return null;
    }

    const data = (await res.json()) as {
      features?: Array<{
        geometry?: { coordinates?: [number, number] };
        properties?: { full_address?: string; place_formatted?: string };
      }>;
    };

    const feature = data.features?.[0];
    draftLog('geocode', {
      name,
      status: res.status,
      ms: Date.now() - t0,
      features: data.features?.length ?? 0,
      hit: !!feature?.geometry?.coordinates,
    });

    const coords = feature?.geometry?.coordinates;
    if (!coords || coords.length !== 2) return null;

    const [lng, lat] = coords;
    if (
      typeof lng !== 'number' ||
      typeof lat !== 'number' ||
      isNaN(lng) ||
      isNaN(lat)
    ) {
      return null;
    }

    const address =
      feature?.properties?.full_address ??
      feature?.properties?.place_formatted ??
      null;

    return { location: { lat, lng }, address };
  } catch (error) {
    logger.warn(
      `ジオコーディング中にエラー: ${name} (${
        error instanceof Error ? error.message : 'unknown'
      })`,
    );
    return null;
  } finally {
    release();
  }
}
