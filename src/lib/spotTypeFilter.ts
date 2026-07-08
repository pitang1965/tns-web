import {
  CampingSpotTypeLabels,
  type CampingSpotType,
} from '@/data/schemas/campingSpot';

/**
 * 車中泊スポット種別フィルタ（複数選択）のための共通ユーティリティ。
 *
 * 状態は「選択された種別キーの配列」で表現し、空配列は「絞り込みなし＝全種別」を意味する。
 * URL・localStorage・共有リンクではカンマ区切り文字列としてやり取りする。
 */

// 種別キーの正規順（CampingSpotTypeLabels の定義順）。
// URL・表示・保存で常にこの順に整列させ、同じ選択が常に同じ表現になるようにする。
export const SPOT_TYPE_ORDER = Object.keys(
  CampingSpotTypeLabels,
) as CampingSpotType[];

const VALID_SPOT_TYPES = new Set<string>(SPOT_TYPE_ORDER);

// nafuda対象検索の対象種別。詳細は CONTEXT.md「nafuda対象検索」を参照。
export const NAFUDA_SPOT_TYPES: CampingSpotType[] = [
  'rv_park',
  'auto_campground',
];

/**
 * URL / localStorage 由来の種別値を、正規化した種別配列に変換する。
 * - カンマ区切り文字列・配列・null/undefined を許容
 * - 旧センチネル 'all' や空文字は「絞り込みなし」= [] とみなす
 * - 未知のキーを除外し、重複を排除し、SPOT_TYPE_ORDER 順に整列
 */
export function parseSpotTypes(
  value: string | string[] | null | undefined,
): CampingSpotType[] {
  if (value == null) return [];
  const raw = Array.isArray(value) ? value : value.split(',');
  const set = new Set<string>();
  for (const item of raw) {
    const key = item.trim();
    if (key === '' || key === 'all') continue;
    if (VALID_SPOT_TYPES.has(key)) set.add(key);
  }
  return SPOT_TYPE_ORDER.filter((t) => set.has(t));
}

/**
 * 種別配列を URL / 共有用のカンマ区切り文字列にする。
 * 空配列（＝全種別）は null（パラメータ省略）を返す。
 */
export function serializeSpotTypes(
  types: string | string[] | null | undefined,
): string | null {
  const normalized = parseSpotTypes(types);
  return normalized.length > 0 ? normalized.join(',') : null;
}

/**
 * nafuda対象検索かどうかを判定する。
 * 1つ以上選択され、かつ選択された種別がすべて nafuda対象種別であること（subset）。
 */
export function isNafudaSpotSelection(
  value: string | string[] | null | undefined,
): boolean {
  const normalized = parseSpotTypes(value);
  return (
    normalized.length > 0 &&
    normalized.every((t) => NAFUDA_SPOT_TYPES.includes(t))
  );
}

/**
 * 種別配列を「・」区切りのラベル文字列にする（空なら null）。
 * SEO タイトルや共有テキスト・フィルタ説明に使う。
 */
export function spotTypesToLabel(
  types: string | string[] | null | undefined,
): string | null {
  const normalized = parseSpotTypes(types);
  if (normalized.length === 0) return null;
  return normalized.map((t) => CampingSpotTypeLabels[t]).join('・');
}
