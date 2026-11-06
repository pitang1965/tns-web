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
 *   node scripts/sync-indexes.cjs                                   # ドライラン(既定=URI末尾のDB。.env.local なら itinerary_db_dev)
 *   node scripts/sync-indexes.cjs --confirm                         # 同じDBに作成
 *   node scripts/sync-indexes.cjs --env=.env.production.vps         # 本番のドライラン(本番の権限があるユーザーで見る)
 *   node scripts/sync-indexes.cjs --env=.env.production.vps --confirm  # 本番に作成
 *   node scripts/sync-indexes.cjs --db=itinerary_db                 # 対象DBを明示する
 *   node scripts/sync-indexes.cjs --collection=campingspots         # 対象を1つに絞る
 *   --env=<ファイル> は接続先(MONGODB_URI)を読むファイル(既定=.env.local)
 */

const { MongoClient } = require('mongodb');

function getArg(name, fallback) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

// --env-file だと Node 本体のオプションと衝突して起動できないため --env とする。
const ENV_FILE = getArg('env', '.env.local');
const dotenvResult = require('dotenv').config({ path: ENV_FILE });
if (dotenvResult.error) {
  console.error(`環境変数ファイルを読めません: ${ENV_FILE} — ${dotenvResult.error.message}`);
  process.exit(1);
}
// process.env ではなくファイルの中身から読む。シェルに残った MONGODB_URI
// （例: MCPの読み取り専用接続）が使われ、表示のファイル名と食い違うのを防ぐ。
const MONGODB_URI = dotenvResult.parsed.MONGODB_URI;
if (!MONGODB_URI) {
  console.error(`MONGODB_URI が ${ENV_FILE} に設定されていません`);
  process.exit(1);
}

// --db が無ければ URI 末尾のDB名（アプリが実際に使うDB）を対象にする。
function dbNameFromUri(uri) {
  try {
    return decodeURIComponent(new URL(uri).pathname.slice(1)) || null;
  } catch {
    return null;
  }
}

const CONFIRM = process.argv.includes('--confirm');
const DB_NAME = getArg('db', dbNameFromUri(MONGODB_URI));
if (!DB_NAME) {
  // 黙って開発DBに倒すと、本番用ファイルでも別DBを対象にしてしまうため止める。
  console.error(`URI からDB名を読み取れません（${ENV_FILE}）。--db=<DB名> を指定してください`);
  process.exit(1);
}
const ONLY_COLLECTION = getArg('collection', null);

// 各モデルの索引定義と一致させること。片方だけ変えると本番と開発で挙動が食い違う。
//   fieldreports  ← src/lib/models/FieldReport.ts
//   campingspots  ← src/lib/models/CampingSpot.ts
//   campingspotsubmissions ← src/lib/models/CampingSpotSubmission.ts
//   pointbalances ← src/lib/models/PointBalance.ts
//   pointtransactions ← src/lib/models/PointTransaction.ts
const INDEXES_BY_COLLECTION = {
  itineraries: [
    {
      key: { 'owner.id': 1 },
      options: { name: 'owner.id_1' },
      why: '所有者（Auth0 の sub）での絞り込み',
    },
    {
      key: { 'owner.email': 1 },
      options: { name: 'owner.email_1' },
      why: '所有者（認証済みメール）での絞り込み。ログイン接続が変わっても自分の旅程を見せるため',
    },
    {
      key: { isPublic: 1, updatedAt: -1 },
      options: { name: 'isPublic_1_updatedAt_-1' },
      why: '公開旅程一覧（更新の新しい順）',
    },
  ],
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
  ],
  campingspotsubmissions: [
    {
      key: { status: 1, submittedAt: -1 },
      options: { name: 'status_1_submittedAt_-1' },
      why: '管理画面の投稿一覧（状態別・投稿日時の新しい順）',
    },
    {
      key: { coordinates: '2dsphere' },
      options: { name: 'coordinates_2dsphere' },
      why: '投稿時の重複チェック（$near）。無いと投稿APIが失敗する',
    },
    {
      key: { prefecture: 1 },
      options: { name: 'prefecture_1' },
      why: '都道府県での絞り込み',
    },
  ],
  pointbalances: [
    {
      key: { email: 1 },
      options: { unique: true, name: 'email_1' },
      why: '1メール1残高（ユニーク制約）。同時付与で残高ドキュメントが二重にできるのを防ぐ',
    },
  ],
  pointtransactions: [
    {
      key: { email: 1, createdAt: -1 },
      options: { name: 'email_1_createdAt_-1' },
      why: 'ユーザーごとの履歴（新しい順）',
    },
  ],
  shortlinks: [
    {
      key: { code: 1 },
      options: { unique: true, name: 'code_1' },
      why: 's.nafuda.me/<code> のリダイレクト先検索（ユニーク制約）',
    },
    {
      key: { targetUrl: 1 },
      options: { unique: true, name: 'targetUrl_1' },
      why: '同じURLの重複発行を防ぎ、既存の短縮URLを再利用する（ユニーク制約）',
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
    if (error.codeName !== 'NamespaceNotFound') {
      console.error(`  索引一覧を取得できません: ${error.message}`);
      console.log('');
      process.exitCode = 1;
      return;
    }
    // 新しいDBなどでコレクション未作成。createIndex がコレクションごと作るので先へ進む。
    // 最初の1件より前にユニーク制約や 2dsphere を張っておくため、ここで飛ばしてはいけない。
    console.log('  コレクション未作成（索引作成時に作られます）');
    before = [];
  }

  const existingByName = new Map(before.map((index) => [index.name, index]));
  const missing = wanted.filter((index) => !existingByName.has(index.options.name));

  // 同名でもユニーク指定が違えば制約が効いていない。drop はせず知らせるだけ。
  const mismatched = wanted.filter((index) => {
    const existing = existingByName.get(index.options.name);
    return existing && !!existing.unique !== !!index.options.unique;
  });
  if (mismatched.length > 0) {
    console.error('  定義が食い違っています（ユニーク指定。自動では直しません）:');
    mismatched.forEach((index) =>
      console.error(`    ! ${index.options.name} … モデルは unique=${!!index.options.unique}`),
    );
    process.exitCode = 1;
  }

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
  const uri = MONGODB_URI;

  const targets = ONLY_COLLECTION
    ? { [ONLY_COLLECTION]: INDEXES_BY_COLLECTION[ONLY_COLLECTION] }
    : INDEXES_BY_COLLECTION;

  if (ONLY_COLLECTION && !INDEXES_BY_COLLECTION[ONLY_COLLECTION]) {
    console.error(
      `未知のコレクション: ${ONLY_COLLECTION}（対象: ${Object.keys(INDEXES_BY_COLLECTION).join(', ')}）`,
    );
    process.exit(1);
  }

  console.log('接続先:', maskUri(uri), `(${ENV_FILE})`);
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
