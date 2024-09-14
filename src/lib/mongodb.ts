// src/lib/mongodb.ts

import { MongoClient } from 'mongodb';

// グローバル変数の型を適切に定義
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = {};

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

// モジュールスコープの MongoClient Promise をエクスポート
export default clientPromise;
