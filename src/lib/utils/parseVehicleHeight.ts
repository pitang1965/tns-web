// 制限事項/備考テキストから高さ制限3フィールドを推定する。
// ロジックは scripts/migrate-height-fields.cjs / export-height-report.cjs と同一。
// （Node用 .cjs スクリプトとの共有ができないため、パリティを保って移植している）

export type DerivedVehicleHeight = {
  // undefined = 不明/なし
  maxVehicleHeight?: number;
  noHeightLimit?: boolean;
  heightLimitCaution?: boolean;
  // 判定カテゴリ（デバッグ・通知用）
  category:
    | '制限値(区画差・要注意)'
    | '無制限+一部制限(要注意)'
    | '制限値'
    | '無制限'
    | '値不明'
    | '情報なし';
};

function normalize(s: string): string {
  return String(s)
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/．/g, '.')
    .replace(/，/g, ',')
    .replace(/：/g, ':')
    .replace(/／/g, '/')
    .replace(/[ｍＭ]/g, 'm')
    .replace(/[ｃＣ]/g, 'c')
    .replace(/㎝/g, 'cm')
    .replace(/㎜/g, 'mm');
}

function toCm(val: number, unit?: string): number | null {
  if (unit === 'mm') {
    if (val < 100) return Math.round(val * 100); // 2.0mm(誤記) -> 200cm
    return Math.round(val / 10); // 2100mm -> 210cm
  }
  if (unit === 'cm') return Math.round(val);
  if (unit === 'm' || unit === 'メートル') return Math.round(val * 100);
  if (val < 10) return Math.round(val * 100);
  if (val >= 100 && val < 500) return Math.round(val);
  if (val >= 1000 && val < 5000) return Math.round(val / 10);
  return null;
}

// 高さ数値を抽出。results=実際に効く制限(100〜380未満)、largeClearance=380cm以上(実質無制限)
function parseHeights(rawText: string): {
  results: number[];
  largeClearance: boolean;
} {
  const t = normalize(rawText).replace(/(\d),(\d)/g, '$1$2');
  const re =
    /(?<![標上最])(?:全|車)?高(?:さ)?\s*(?:制限)?\s*[:\/]?\s*(?:約)?(\d+(?:\.\d+)?)\s*(mm|cm|m|メートル)?/g;
  const results: number[] = [];
  let largeClearance = false;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t)) !== null) {
    const cm = toCm(parseFloat(m[1]), m[2]);
    if (cm == null) continue;
    if (cm >= 100 && cm < 380) results.push(cm);
    else if (cm >= 380) largeClearance = true; // 3.8m以上=全車入れる=実質無制限
  }
  return { results, largeClearance };
}

/**
 * 制限事項テキスト（＋備考）から高さ制限3フィールドを推定する。
 * @param restrictionsText - 制限事項（配列を結合した文字列でも可）
 * @param notes - 備考（任意）
 */
export function deriveVehicleHeight(
  restrictionsText: string,
  notes = '',
): DerivedVehicleHeight {
  const combined = `${restrictionsText} ${notes}`;
  const norm = normalize(combined);
  const { results, largeClearance } = parseHeights(combined);

  const hasNoLimitText =
    /無制限|無限大|(?:全高|車高|高さ)\s*制限\s*[:：]?\s*(?:なし|無し|ナシ)/.test(
      norm,
    );
  const hasUnknown = /(高さ|全高|車高|制限).{0,6}(不明|未確認)/.test(combined);

  const noLimit = hasNoLimitText || largeClearance;
  const distinct = [...new Set(results)];

  let maxVehicleHeight: number | undefined;
  let noHeightLimit: boolean | undefined;
  let heightLimitCaution: boolean | undefined;
  let category: DerivedVehicleHeight['category'];

  if (noLimit) {
    noHeightLimit = true;
    if (results.length) {
      // 一部区画に実制限あり + 別区画は無制限 → 要注意（可能性は無制限）
      heightLimitCaution = true;
      category = '無制限+一部制限(要注意)';
    } else {
      category = '無制限';
    }
  } else if (results.length) {
    maxVehicleHeight = Math.max(...results); // 可能性=最大区画
    if (distinct.length >= 2) {
      heightLimitCaution = true; // 区画により制限が異なる
      category = '制限値(区画差・要注意)';
    } else {
      category = '制限値';
    }
  } else if (hasUnknown) {
    category = '値不明';
  } else {
    category = '情報なし';
  }

  return { maxVehicleHeight, noHeightLimit, heightLimitCaution, category };
}

/**
 * 推定結果が「値として設定できるもの」を含むか（＝自動設定する価値があるか）
 */
export function hasDerivedHeightValue(d: DerivedVehicleHeight): boolean {
  return (
    d.maxVehicleHeight != null ||
    d.noHeightLimit === true ||
    d.heightLimitCaution === true
  );
}
