import { MongoClient, Db } from 'mongodb';

// グローバル変数の型を適切に定義
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// APP_MONGODB_URI を優先し、なければ MONGODB_URI を使用
// これにより、MCP サーバーが MONGODB_URI を上書きしても影響を受けない
function getMongoUri(): string {
  const appUri = process.env.APP_MONGODB_URI;
  if (appUri) return appUri;

  const uri = process.env.MONGODB_URI;
  if (uri) return uri;

  throw new Error(
    'Invalid/Missing environment variable: "APP_MONGODB_URI" or "MONGODB_URI"'
  );
}

const uri = getMongoUri();
const options = {};

// データベース名を環境変数から取得、またはURIから抽出
function getDatabaseName(): string {
  // 環境変数で明示的に指定されている場合はそれを使用
  if (process.env.MONGODB_DATABASE) {
    return process.env.MONGODB_DATABASE;
  }

  // URIからデータベース名を抽出（mongodb+srv://.../.../database?... の形式）
  const match = uri.match(/mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/);
  if (match && match[1]) {
    return match[1];
  }

  // 開発環境のデフォルト
  if (process.env.NODE_ENV === 'development') {
    return 'itinerary_db_dev';
  }

  // 本番環境のデフォルト
  return 'itinerary_db';
}

const DATABASE_NAME = getDatabaseName();

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // 開発モードでは、グローバル変数を使用してHMR間で値を保持
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // 本番モードでは、グローバル変数を使用しない
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// データベースインスタンスを取得するヘルパー関数
// 明示的にデータベース名を指定することで、接続URIの解析に依存しない
export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(DATABASE_NAME);
}

// モジュールスコープの MongoClient Promise をエクスポート
export default clientPromise;
