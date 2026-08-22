/**
 * MongoDB 索引の同期スクリプト（追加のみ・削除は一切しない）
 *
 * なぜ必要か:
 *   src/lib/database.ts で `autoIndex: process.env.NODE_ENV !== 'production'` としているため、
 *   本番では Mongoose が索引を自動作成しない（サーバーレスでコールドスタートのたびに
 *   索引同期が走るのを避けるため、これは意図した設定）。
 *   その結果、モデルに索引を足しても本番には反映されない。ここで明示的に作成する。
 *
 *   実例: maxVehicleHeight(全高)フィルタの追加時、本番に maxVehicleHeight_1 が作られず、
 *   全高での絞り込みがコレクションスキャンになっていた。
 *
 * 安全策:
 *   - 既定は「ドライラン」: 差分を表示するだけで、作成はしない。--confirm で作成。
 *   - 作成のみ。既存の索引を drop することは絶対にしない（意図しない性能劣化を防ぐ）。
 *   - モデルに無いのにDBにある索引は「参考情報」として表示するだけで、手を触れない。
 *   - 接続先とDB名を必ず表示してから実行する。
 *
 * 使い方:
 *   node scripts/sync-indexes.cjs                                   # ドライラン(既定=itinerary_db_dev)
 *   node scripts/sync-indexes.cjs --confirm                         # itinerary_db_dev に作成
 *   node scripts/sync-indexes.cjs --db=itinerary_db                 # 本番のドライラン
 *   node scripts/sync-indexes.cjs --db=itinerary_db --confirm       # 本番に作成
 *   node scripts/sync-indexes.cjs --collection=campingspots         # 対象を1つに絞る
 */

const { MongoClient } = require('mongodb');

// override: true は意図的。dotenv は既存の環境変数を上書きしないため、
// シェルに MONGODB_URI が残っていると（例: MCPの読み取り専用接続）
// そちらが優先され、createIndex が権限エラーで黙って失敗する。
require('dotenv').config({ path: '.env.local', override: true });

function getArg(name, fallback) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

const CONFIRM = process.argv.includes('--confirm');
const DB_NAME = getArg('db', 'itinerary_db_dev');
const ONLY_COLLECTION = getArg('collection', null);

// 各モデルの索引定義と一致させること。片方だけ変えると本番と開発で挙動が食い違う。
//   fieldreports  ← src/lib/models/FieldReport.ts
//   campingspots  ← src/lib/models/CampingSpot.ts
const INDEXES_BY_COLLECTION = {
  fieldreports: [
    {
      key: { spotId: 1, authorSub: 1, visitedYearMonth: 1 },
      options: { unique: true, name: 'spotId_1_authorSub_1_visitedYearMonth_1' },
      why: '同一スポット・同一訪問年月に1ユーザー1件（ユニーク制約）',
    },
    {
      key: { spotId: 1, isHidden: 1, visitedYearMonth: -1, createdAt: -1 },
      options: { name: 'spotId_1_isHidden_1_visitedYearMonth_-1_createdAt_-1' },
      why: '詳細ページの一覧取得（訪問年月の新しい順）',
    },
    {
      key: { authorSub: 1, createdAt: -1 },
      options: { name: 'authorSub_1_createdAt_-1' },
      why: '投稿間隔の制限（直近24時間の件数カウント）',
    },
  ],
  campingspots: [
    {
      key: { coordinates: '2dsphere' },
      options: { name: 'coordinates_2dsphere' },
      why: '地図の範囲検索・近傍検索',
    },
    {
      key: { prefecture: 1 },
      options: { name: 'prefecture_1' },
      why: '都道府県での絞り込み',
    },
    {
      key: { type: 1 },
      options: { name: 'type_1' },
      why: 'スポット種別での絞り込み',
    },
    {
      key: { maxVehicleHeight: 1 },
      options: { name: 'maxVehicleHeight_1' },
      why: '全高制限での絞り込み',
    },
    {
      key: { 'pricing.isFree': 1 },
      options: { name: 'pricing.isFree_1' },
      why: '無料/有料での絞り込み',
    },
    {
      key: { quietnessLevel: 1 },
      options: { name: 'quietnessLevel_1' },
      why: '旧評価システム（段階的廃止予定）',
    },
    {
      key: { securityLevel: 1 },
      options: { name: 'securityLevel_1' },
      why: '旧評価システム（段階的廃止予定）',
    },
    {
      key: { overallRating: 1 },
      options: { name: 'overallRating_1' },
      why: '旧評価システム（段階的廃止予定）',
    },
    {
      key: {
        coordinates: '2dsphere',
        type: 1,
        'pricing.isFree': 1,
        quietnessLevel: 1,
        securityLevel: 1,
      },
      options: {
        name: 'coordinates_2dsphere_type_1_pricing.isFree_1_quietnessLevel_1_securityLevel_1',
      },
      why: 'よく使う絞り込みの複合索引',
    },
  ],
};

function maskUri(uri) {
  return uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
}

function describeIndex(index) {
  return `${index.name} ${JSON.stringify(index.key)}${index.unique ? ' [unique]' : ''}`;
}

async function syncCollection(db, collectionName, wanted) {
  console.log(`── ${collectionName} ${'─'.repeat(Math.max(0, 50 - collectionName.length))}`);

  const collection = db.collection(collectionName);

  let before;
  try {
    before = await collection.indexes();
  } catch (error) {
    // コレクションが未作成（まだ1件も投稿がない等）
    console.log(`  コレクションが存在しません: ${error.message}`);
    console.log('');
    return;
  }

  const existingNames = new Set(before.map((index) => index.name));
  const missing = wanted.filter((index) => !existingNames.has(index.options.name));

  // モデルに無いのにDBにある索引。表示するだけで触らない。
  const wantedNames = new Set(wanted.map((index) => index.options.name));
  const extra = before.filter(
    (index) => index.name !== '_id_' && !wantedNames.has(index.name),
  );

  console.log(`  現在: ${before.length}件`);
  before.forEach((index) => console.log(`    - ${describeIndex(index)}`));

  if (extra.length > 0) {
    console.log('  モデルに定義が無い索引（削除しません。参考情報）:');
    extra.forEach((index) => console.log(`    ? ${index.name}`));
  }

  if (missing.length === 0) {
    console.log('  不足なし');
    console.log('');
    return;
  }

  console.log(`  不足: ${missing.length}件`);
  missing.forEach((index) =>
    console.log(`    + ${index.options.name} … ${index.why}`),
  );

  if (!CONFIRM) {
    console.log('  （ドライランのため作成しませんでした）');
    console.log('');
    return;
  }

  for (const index of missing) {
    try {
      await collection.createIndex(index.key, index.options);
      console.log(`  作成: ${index.options.name}`);
    } catch (error) {
      console.error(`  失敗: ${index.options.name} — ${error.message}`);
      // 原因に応じた案内にする。何でも「重複の可能性」と出すと誤診を招く。
      if (error.code === 11000 || error.codeName === 'DuplicateKey') {
        console.error(
          '    既存データに重複があります。重複を確認・整理してから再実行してください。',
        );
      } else if (/not allowed to do action/.test(error.message)) {
        console.error(
          '    接続しているDBユーザーに索引作成権限がありません。上の接続先を確認してください。',
        );
      }
      process.exitCode = 1;
    }
  }

  console.log('');
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI が .env.local に設定されていません');
    process.exit(1);
  }

  const targets = ONLY_COLLECTION
    ? { [ONLY_COLLECTION]: INDEXES_BY_COLLECTION[ONLY_COLLECTION] }
    : INDEXES_BY_COLLECTION;

  if (ONLY_COLLECTION && !INDEXES_BY_COLLECTION[ONLY_COLLECTION]) {
    console.error(
      `未知のコレクション: ${ONLY_COLLECTION}（対象: ${Object.keys(INDEXES_BY_COLLECTION).join(', ')}）`,
    );
    process.exit(1);
  }

  console.log('接続先:', maskUri(uri));
  console.log('対象DB:', DB_NAME);
  console.log('モード:', CONFIRM ? '作成する (--confirm)' : 'ドライラン（読み取りのみ）');
  if (DB_NAME === 'itinerary_db') {
    console.log('*** 本番データベースです ***');
  }
  console.log('');

  const client = new MongoClient(uri);
  await client.connect();

  try {
    const db = client.db(DB_NAME);
    for (const [collectionName, wanted] of Object.entries(targets)) {
      await syncCollection(db, collectionName, wanted);
    }
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
