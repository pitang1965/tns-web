import { LatLng } from './types';
import { logger } from '@/lib/logger';
import { draftLog } from './debug';

export type GeocodeResult = {
  location: LatLng;
  address: string | null;
};

/**
 * 場所名 → 座標の解決（サーバー側）。
 *
 * ADR-0008: LLM が提案した観光地・入浴施設等の場所名を、既存アプリが使う
 * Mapbox Search Box API の forward（一発解決）エンドポイントで座標化する。
 * PlaceNameAutocomplete.tsx と同じ API ファミリで、新規依存は増やさない。
 *
 * 誤ジオコーディング対策として、候補が得られなければ null を返す（推測で
 * 誤座標を置かない）。呼び出し側は null のとき location を null にする。
 *
 * @param proximity 経路周辺にバイアスをかける基準点（任意）
 */
export async function geocodePlaceName(
  name: string,
  proximity?: LatLng,
): Promise<GeocodeResult | null> {
  // サーバー用トークン(URL制限なし)を優先。無ければ公開トークンにフォールバック。
  // 公開トークンはURL制限でサーバー側リクエストが403になるため MAPBOX_SERVER_TOKEN を推奨。
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

  try {
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

    const url = `https://api.mapbox.com/search/searchbox/v1/forward?${params.toString()}`;
    const t0 = Date.now();
    const res = await fetch(url);
    if (!res.ok) {
      logger.warn(`ジオコーディング失敗: ${name} (status ${res.status})`);
      draftLog('geocode', {
        name,
        status: res.status,
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
  }
}
