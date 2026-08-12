/**
 * 全高制限(maxVehicleHeight)移行の「ドライラン」レポート出力スクリプト
 *
 * - DBには一切書き込みません（read-onlyのfindのみ）。
 * - restrictions / notes のテキストから全高制限(cm)を抽出し、
 *   目視確認用のCSVを出力します。
 * - 接続先DBは MONGODB_URI のパスから自動判定します（例: itinerary_db_dev）。
 *
 * 実行例:
 *   node scripts/export-height-report.cjs
 *   node scripts/export-height-report.cjs --db=itinerary_db \
 *     --url-base=https://tabi.over40web.club/admin/shachu-haku/ \
 *     --filter=parking-noinfo --out=tmp/prod-parking-noinfo.csv
 *
 * オプション（すべて任意）:
 *   --db=<名前>          接続先DB名（未指定は MONGODB_URI から自動判定）
 *   --url-base=<URL>     管理URLの接頭辞
 *   --filter=parking-noinfo  種別=駐車場 かつ 判定=情報なし のみ出力
 *   --out=<パス>         出力CSVパス（プロジェクトからの相対 or 絶対）
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env.local' });

// --- コマンドライン引数 ---
function getArg(name, fallback) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

const DB_OVERRIDE = getArg('db', null);
const FILTER = getArg('filter', null); // 'parking-noinfo' | null
const OUT_ARG = getArg('out', 'tmp/camping-height-report.csv');
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

// 全角→半角などの正規化
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

// 数値＋単位を cm(整数) に変換
function toCm(val, unit) {
  if (unit === 'mm') {
    // 誤記対策: 2.0mm のような小さすぎる値は「m」の打ち間違いとみなす
    // （実際のmm表記は 2100mm など4桁）
    if (val < 100) return Math.round(val * 100); // 2.0mm -> 200cm
    return Math.round(val / 10); // 2100mm -> 210cm
  }
  if (unit === 'cm') return Math.round(val);
  if (unit === 'm' || unit === 'メートル') return Math.round(val * 100);
  // 単位なし: 桁で推定
  if (val < 10) return Math.round(val * 100); // 2.1 -> 210
  if (val >= 100 && val < 500) return Math.round(val); // 230 -> 230cm
  if (val >= 1000 && val < 5000) return Math.round(val / 10); // 2100 -> 210
  return null;
}

// テキストから全高制限の候補(cm)を全て抽出
// results: 妥当範囲(1.0〜12m)の候補cm配列 / sawHeightNumber: 高さ数値表記が存在したか
function parseHeights(rawText) {
  const t = normalize(rawText).replace(/(\d),(\d)/g, '$1$2'); // 桁区切り除去
  // 「全高」「車高」「高さ」に加え、略式の単漢字「高」も対象。
  // ただし 標高 / 地上高 / 最高 は否定先読みで除外。
  const re =
    /(?<![標上最])(?:全|車)?高(?:さ)?\s*(?:制限)?\s*[:\/]?\s*(?:約)?(\d+(?:\.\d+)?)\s*(mm|cm|m|メートル)?/g;
  const results = [];
  let sawHeightNumber = false;
  let m;
  while ((m = re.exec(t)) !== null) {
    sawHeightNumber = true;
    const val = parseFloat(m[1]);
    const cm = toCm(val, m[2]);
    // 実際に効く高さ制限のみ採用: 1.0m以上、かつ3.8m未満
    // （道路運送車両法の車両高さ上限=3.8m。これ以上は全車入れる=実質無制限）
    if (cm != null && cm >= 100 && cm < 380) results.push(cm);
  }
  return { results, sawHeightNumber };
}

function classify(restrictionsText, notes) {
  const combined = `${restrictionsText} ${notes}`;
  const { results, sawHeightNumber } = parseHeights(combined);
  if (results.length) {
    return { category: '制限値', cm: Math.min(...results) };
  }
  // 「無制限」「無限大」に加え、高さ限定の「高さ制限なし/無し」も制限なし扱い。
  // （「時間制限なし」等を誤検出しないよう、高さキーワード直後に限定）
  if (
    /無制限|無限大|(?:全高|車高|高さ)\s*制限\s*[:：]?\s*(?:なし|無し|ナシ)/.test(
      normalize(combined)
    )
  ) {
    return { category: '無制限', cm: '' };
  }
  // 高さ数値はあったが妥当範囲外（例: 高さ30m の誤記や極端なクリアランス）
  // = 実質「制限なし」とみなす
  if (sawHeightNumber) {
    return { category: '無制限', cm: '' };
  }
  if (/(高さ|全高|車高|制限).{0,6}(不明|未確認)/.test(combined)) {
    return { category: '値不明', cm: '' };
  }
  return { category: '情報なし', cm: '' };
}

// CSVフィールドのエスケープ
function csv(v) {
  const s = v == null ? '' : String(v);
  return '"' + s.replace(/"/g, '""') + '"';
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI が .env.local にありません');
    process.exit(1);
  }
  const dbName =
    DB_OVERRIDE || (uri.match(/\/([^/?]+)\?/) || [])[1] || 'itinerary_db_dev';
  console.log(`接続先DB: ${dbName}（read-onlyで参照します）`);
  if (FILTER) console.log(`絞り込み: ${FILTER}`);

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const collection = client.db(dbName).collection('campingspots');

    const docs = await collection
      .find(
        {},
        {
          projection: { name: 1, type: 1, restrictions: 1, notes: 1 },
        }
      )
      .toArray();

    const rows = docs.map((d) => {
      const restrictionsArr = Array.isArray(d.restrictions)
        ? d.restrictions
        : [];
      const restrictionsText = restrictionsArr.join(' | ');
      const notes = d.notes || '';
      const { category, cm } = classify(restrictionsText, notes);
      return {
        url: ADMIN_URL_BASE + d._id,
        name: d.name || '',
        type: d.type,
        typeLabel: TYPE_LABELS[d.type] || d.type || '',
        category,
        cm,
        rittaiNotes: notes.includes('立体') ? '○' : '',
        rittaiName: (d.name || '').includes('立体') ? '○' : '',
        restrictionsText,
        notes,
      };
    });

    // 絞り込み
    let outRows = rows;
    if (FILTER === 'parking-noinfo') {
      outRows = rows.filter(
        (r) => r.type === 'parking_lot' && r.category === '情報なし'
      );
    }

    // 並び順: 判定区分 → 種別 → 抽出cm
    const catOrder = { 制限値: 0, 値不明: 1, 無制限: 2, 情報なし: 3 };
    outRows.sort((a, b) => {
      const c = (catOrder[a.category] ?? 9) - (catOrder[b.category] ?? 9);
      if (c !== 0) return c;
      if (a.typeLabel !== b.typeLabel)
        return a.typeLabel.localeCompare(b.typeLabel, 'ja');
      return (a.cm || 0) - (b.cm || 0);
    });

    const header = [
      '管理URL',
      '名称',
      '種別',
      '判定区分',
      '抽出全高cm',
      '立体(備考)',
      '立体(名称)',
      '制限事項(元テキスト)',
      '備考(元テキスト)',
    ];
    const lines = [header.map(csv).join(',')];
    for (const r of outRows) {
      lines.push(
        [
          r.url,
          r.name,
          r.typeLabel,
          r.category,
          r.cm,
          r.rittaiNotes,
          r.rittaiName,
          r.restrictionsText,
          r.notes,
        ]
          .map(csv)
          .join(',')
      );
    }

    // Excelの日本語文字化け対策でUTF-8 BOMを付与
    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
    fs.writeFileSync(OUT_PATH, '\uFEFF' + lines.join('\r\n'), 'utf8');

    // サマリをコンソール出力
    console.log(`\n全件数: ${rows.length} / 出力件数: ${outRows.length}`);
    if (!FILTER) {
      const summary = {};
      for (const r of rows) summary[r.category] = (summary[r.category] || 0) + 1;
      console.log('判定区分ごとの件数:');
      for (const k of ['制限値', '値不明', '無制限', '情報なし']) {
        console.log(`  ${k}: ${summary[k] || 0}`);
      }
      const rittaiNotesCount = rows.filter((r) => r.rittaiNotes).length;
      const rittaiNameCount = rows.filter((r) => r.rittaiName).length;
      console.log(`備考に「立体」を含む: ${rittaiNotesCount}`);
      console.log(`名称に「立体」を含む: ${rittaiNameCount}`);
    }
    console.log(`\nCSV出力先:\n${OUT_PATH}`);
  } catch (e) {
    console.error('失敗:', e);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
