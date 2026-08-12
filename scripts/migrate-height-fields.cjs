/**
 * 全高フィールド移行スクリプト（restrictions/notes → maxVehicleHeight / noHeightLimit / heightLimitCaution）
 *
 * - 既定は「ドライラン」: DBには書き込まず、投入予定値をCSVに出力するだけ。
 * - --confirm 時のみ書き込み（surgicalに3フィールドのみ $set/$unset。他フィールドは触らない）。
 * - 安全策: 書き込み先が itinerary_db_dev 以外なら中断（本番への誤書き込み防止）。
 *
 * 使い方:
 *   node scripts/migrate-height-fields.cjs                 # ドライラン（読み取りのみ）
 *   node scripts/migrate-height-fields.cjs --confirm       # itinerary_db_dev に書き込み
 *   node scripts/migrate-height-fields.cjs --db=itinerary_db_dev --out=tmp/xxx.csv
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env.local' });

function getArg(name, fallback) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

const CONFIRM = process.argv.includes('--confirm');
const EMIT = process.argv.includes('--emit-import-csv'); // フルCSV生成（管理画面インポート用）
const DST_DB = getArg('db', 'itinerary_db_dev'); // 既定=staging/local
const OUT_ARG = getArg('out', 'tmp/height-migration-preview.csv');
const OUT_PATH = path.isAbsolute(OUT_ARG)
  ? OUT_ARG
  : path.join(process.cwd(), OUT_ARG);
const ADMIN_URL_BASE = getArg(
  'url-base',
  'https://tns-web-git-staging-pitang1965s-projects.vercel.app/admin/shachu-haku/'
);

const TYPE_LABELS = {
  roadside_station: '道の駅・◯◯の駅',
  sa_pa: 'SA/PA',
  rv_park: 'RVパーク',
  auto_campground: 'オートキャンプ場',
  onsen_facility: '日帰り温泉施設',
  convenience_store: 'コンビニ',
  parking_lot: '駐車場',
  other: 'その他',
};

// ---- パーサ（export-height-report.cjs と同一ロジック）----
function normalize(s) {
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

function toCm(val, unit) {
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
function parseHeights(rawText) {
  const t = normalize(rawText).replace(/(\d),(\d)/g, '$1$2');
  const re =
    /(?<![標上最])(?:全|車)?高(?:さ)?\s*(?:制限)?\s*[:\/]?\s*(?:約)?(\d+(?:\.\d+)?)\s*(mm|cm|m|メートル)?/g;
  const results = [];
  let largeClearance = false;
  let m;
  while ((m = re.exec(t)) !== null) {
    const cm = toCm(parseFloat(m[1]), m[2]);
    if (cm == null) continue;
    if (cm >= 100 && cm < 380) results.push(cm);
    else if (cm >= 380) largeClearance = true; // 3.8m以上=全車入れる=実質無制限
  }
  return { results, largeClearance };
}

// テキスト → 3フィールド
function derive(restrictionsText, notes) {
  const combined = `${restrictionsText} ${notes}`;
  const norm = normalize(combined);
  const { results, largeClearance } = parseHeights(combined);

  const hasNoLimitText =
    /無制限|無限大|(?:全高|車高|高さ)\s*制限\s*[:：]?\s*(?:なし|無し|ナシ)/.test(
      norm
    );
  const hasUnknown = /(高さ|全高|車高|制限).{0,6}(不明|未確認)/.test(combined);

  const noLimit = hasNoLimitText || largeClearance;
  const distinct = [...new Set(results)];

  let maxVehicleHeight; // undefined = 不明/なし
  let noHeightLimit;
  let heightLimitCaution;
  let category;

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

function csv(v) {
  const s = v == null ? '' : String(v);
  return '"' + s.replace(/"/g, '""') + '"';
}

// ---- 管理画面インポート用フルCSV（src/lib/csv と同一形式）----
// 列順・変換は campingSpotToCSVRow / CAMPING_SPOT_CSV_HEADERS に一致させること
const EXPORT_HEADERS = [
  'name', 'lat', 'lng', 'prefecture', 'address', 'url', 'type',
  'distanceToToilet', 'distanceToBath', 'distanceToConvenience',
  'nearbyToiletLat', 'nearbyToiletLng', 'nearbyConvenienceLat',
  'nearbyConvenienceLng', 'nearbyBathLat', 'nearbyBathLng', 'elevation',
  'securityHasGate', 'securityHasLighting', 'securityHasStaff',
  'nightNoiseHasNoiseIssues', 'nightNoiseNearBusyRoad', 'nightNoiseIsQuietArea',
  'hasRoof', 'hasPowerOutlet', 'hasGate', 'isFree', 'pricePerNight',
  'priceNote', 'capacity', 'capacityLarge', 'restrictions', 'amenities',
  'notes', 'isOvernightProhibited',
  'maxVehicleHeight', 'noHeightLimit', 'heightLimitCaution',
];

// escapeCSVField（src/lib/csv/utils.ts と同一挙動）
function esc(field) {
  const s = field == null ? '' : String(field);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

const tf = (b) => (b ? 'true' : 'false');

function docToExportRow(d, h) {
  const c = d.coordinates || [];
  const sec = d.security || {};
  const nn = d.nightNoise || {};
  const pr = d.pricing || {};
  return [
    d.name,
    c[1], c[0],
    d.prefecture,
    d.address || '',
    d.url || '',
    d.type,
    d.distanceToToilet || '',
    d.distanceToBath || '',
    d.distanceToConvenience || '',
    d.nearbyToiletCoordinates?.[1] ?? '',
    d.nearbyToiletCoordinates?.[0] ?? '',
    d.nearbyConvenienceCoordinates?.[1] ?? '',
    d.nearbyConvenienceCoordinates?.[0] ?? '',
    d.nearbyBathCoordinates?.[1] ?? '',
    d.nearbyBathCoordinates?.[0] ?? '',
    d.elevation || '',
    tf(sec.hasGate),
    tf(sec.hasLighting),
    tf(sec.hasStaff),
    tf(nn.hasNoiseIssues),
    tf(nn.nearBusyRoad),
    tf(nn.isQuietArea),
    tf(d.hasRoof),
    tf(d.hasPowerOutlet),
    tf(sec.hasGate), // hasGate（後方互換の重複列）
    tf(pr.isFree),
    pr.pricePerNight || '',
    pr.priceNote || '',
    d.capacity || '',
    d.capacityLarge || '',
    (d.restrictions || []).join(','),
    (d.amenities || []).join(','),
    d.notes || '',
    tf(d.isOvernightProhibited),
    h.maxVehicleHeight ?? '',
    h.noHeightLimit ? 'true' : '',
    h.heightLimitCaution ? 'true' : '',
  ];
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI が .env.local にありません');
    process.exit(1);
  }
  if (CONFIRM && DST_DB !== 'itinerary_db_dev') {
    console.error(
      `[安全停止] --confirm の書き込み先は itinerary_db_dev のみ許可。指定: ${DST_DB}`
    );
    process.exit(1);
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const col = client.db(DST_DB).collection('campingspots');
    console.log(`対象DB: ${DST_DB}${CONFIRM ? '（--confirm: 書き込み）' : '（ドライラン: 読み取りのみ）'}`);

    const docs = await col.find({}).toArray();

    const rows = docs.map((d) => {
      const restrictionsText = (
        Array.isArray(d.restrictions) ? d.restrictions : []
      ).join(' | ');
      const notes = d.notes || '';
      const { maxVehicleHeight, noHeightLimit, heightLimitCaution, category } =
        derive(restrictionsText, notes);
      return {
        _id: d._id,
        raw: d,
        url: ADMIN_URL_BASE + d._id,
        name: d.name || '',
        typeLabel: TYPE_LABELS[d.type] || d.type || '',
        maxVehicleHeight,
        noHeightLimit,
        heightLimitCaution,
        category,
        restrictionsText,
        notes,
      };
    });

    // 管理画面インポート用フルCSVを生成して終了
    if (EMIT) {
      const cols = EXPORT_HEADERS.length;
      const lines = [EXPORT_HEADERS.map(esc).join(',')];
      let badCol = 0;
      for (const r of rows) {
        const row = docToExportRow(r.raw, r);
        if (row.length !== cols) badCol++;
        lines.push(row.map(esc).join(','));
      }
      const emitOut = getArg('out', 'tmp/height-import.csv');
      const emitPath = path.isAbsolute(emitOut)
        ? emitOut
        : path.join(process.cwd(), emitOut);
      fs.mkdirSync(path.dirname(emitPath), { recursive: true });
      fs.writeFileSync(emitPath, '﻿' + lines.join('\r\n'), 'utf8');
      const cMax = rows.filter((r) => r.maxVehicleHeight != null).length;
      const cNo = rows.filter((r) => r.noHeightLimit).length;
      const cCaution = rows.filter((r) => r.heightLimitCaution).length;
      console.log(
        `\nインポート用フルCSV: ${rows.length}行 / ${cols}列 / 列数不一致=${badCol}`
      );
      console.log(
        `投入: maxVehicleHeight=${cMax} / noHeightLimit=${cNo} / heightLimitCaution=${cCaution}`
      );
      console.log(`出力: ${emitPath}`);
      return;
    }

    // レビュー用の並び: 要注意/混在を上に
    const order = {
      '制限値(区画差・要注意)': 0,
      '無制限+一部制限(要注意)': 1,
      制限値: 2,
      無制限: 3,
      値不明: 4,
      情報なし: 5,
    };
    rows.sort(
      (a, b) => (order[a.category] ?? 9) - (order[b.category] ?? 9)
    );

    const header = [
      '管理URL',
      '名称',
      '種別',
      'maxVehicleHeight',
      'noHeightLimit',
      'heightLimitCaution',
      '判定',
      '制限事項',
      '備考',
    ];
    const lines = [header.map(csv).join(',')];
    for (const r of rows) {
      lines.push(
        [
          r.url,
          r.name,
          r.typeLabel,
          r.maxVehicleHeight ?? '',
          r.noHeightLimit ? 'true' : '',
          r.heightLimitCaution ? 'true' : '',
          r.category,
          r.restrictionsText,
          r.notes,
        ]
          .map(csv)
          .join(',')
      );
    }
    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
    fs.writeFileSync(OUT_PATH, '﻿' + lines.join('\r\n'), 'utf8');

    // サマリ
    const sum = {};
    let cMax = 0,
      cNo = 0,
      cCaution = 0;
    for (const r of rows) {
      sum[r.category] = (sum[r.category] || 0) + 1;
      if (r.maxVehicleHeight != null) cMax++;
      if (r.noHeightLimit) cNo++;
      if (r.heightLimitCaution) cCaution++;
    }
    console.log(`\n総件数: ${rows.length}`);
    console.log('判定内訳:');
    for (const k of Object.keys(order)) console.log(`  ${k}: ${sum[k] || 0}`);
    console.log(
      `\n投入予定: maxVehicleHeight=${cMax}件 / noHeightLimit=${cNo}件 / heightLimitCaution=${cCaution}件`
    );
    console.log(`\nプレビューCSV: ${OUT_PATH}`);

    if (!CONFIRM) {
      console.log(
        `\n[ドライラン] 書き込みなし。実行は --confirm（書き込み先=itinerary_db_dev のみ）`
      );
      return;
    }

    // ---- 書き込み（--confirm）----
    let updated = 0;
    for (const r of rows) {
      const set = {};
      const unset = {};
      if (r.maxVehicleHeight != null) set.maxVehicleHeight = r.maxVehicleHeight;
      else unset.maxVehicleHeight = 1;
      if (r.noHeightLimit) set.noHeightLimit = true;
      else unset.noHeightLimit = 1;
      if (r.heightLimitCaution) set.heightLimitCaution = true;
      else unset.heightLimitCaution = 1;

      const update = {};
      if (Object.keys(set).length) update.$set = set;
      if (Object.keys(unset).length) update.$unset = unset;
      await col.updateOne({ _id: r._id }, update);
      updated++;
      if (updated % 200 === 0) console.log(`  更新 ${updated}/${rows.length}`);
    }
    console.log(`\n書き込み完了: ${updated}件を更新`);
  } catch (e) {
    console.error('失敗:', e);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
