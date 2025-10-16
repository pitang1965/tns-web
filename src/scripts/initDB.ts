// ⚠️ WARNING: This script initializes the database with sample data
// ⚠️ 警告：このスクリプトはサンプルデータでデータベースを初期化します

import { MongoClient, ObjectId } from 'mongodb';
// 注意：以下では＠/data... とはできない
import { sampleItineraries } from '../data/sampleData/sampleItineraries.js';
import dotenv from 'dotenv';
import { createInterface } from 'readline';

console.log('🚀 Database initialization script started');

// Load environment variables
dotenv.config({ path: '.env.local' });

// 安全確認：本番環境データベースへの接続を防ぐ
const PRODUCTION_DB_NAME = 'itinerary_db';
const DEVELOPMENT_DB_NAME = 'itinerary_db_dev';

async function confirmAction(question: string): Promise<boolean> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

async function initDb() {
  console.log('📋 Initializing database with sample data');

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('❌ MONGODB_URI is not defined in the environment variables.');
  }

  // データベース名を抽出して確認
  const dbNameMatch = uri.match(/\.net\/([^?]+)/);
  const targetDbName = dbNameMatch ? dbNameMatch[1] : PRODUCTION_DB_NAME;

  console.log(`\n📍 Target database: ${targetDbName}`);
  console.log(`📍 Connection URI: ${uri.replace(/:[^:@]+@/, ':****@')}\n`);

  // 本番環境データベースへの接続を防ぐ
  if (targetDbName === PRODUCTION_DB_NAME) {
    console.error('❌ ERROR: Attempting to initialize PRODUCTION database!');
    console.error('❌ エラー：本番環境データベースを初期化しようとしています！');
    console.error(`\n⚠️  Current database: ${targetDbName}`);
    console.error(`⚠️  Expected database: ${DEVELOPMENT_DB_NAME}`);
    console.error('\n💡 Please update MONGODB_URI in .env.local to use itinerary_db_dev');
    console.error('💡 .env.local の MONGODB_URI を itinerary_db_dev に更新してください');
    process.exit(1);
  }

  // 開発環境でも確認を求める
  const confirmed = await confirmAction(
    `⚠️  This will DELETE ALL data in "${targetDbName}" and insert sample data.\n` +
    `⚠️  "${targetDbName}" の全データを削除し、サンプルデータを挿入します。\n` +
    `\nDo you want to continue? (y/N): `
  );

  if (!confirmed) {
    console.log('✅ Operation cancelled. Database unchanged.');
    console.log('✅ 操作がキャンセルされました。データベースは変更されていません。');
    process.exit(0);
  }

  console.log('\n🔌 Connecting to MongoDB...');
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const database = client.db(targetDbName);
    const collection = database.collection('itineraries');

    // 既存データの件数を確認
    const existingCount = await collection.countDocuments();
    console.log(`📊 Existing documents: ${existingCount}`);

    // データを削除
    console.log('🗑️  Deleting existing data...');
    await collection.deleteMany({});
    console.log('✅ Existing data deleted');

    // `_id` を `ObjectId` に変換
    const itinerariesWithObjectId = sampleItineraries.map((itinerary) => ({
      ...itinerary,
      _id: new ObjectId(itinerary._id),
    }));

    // サンプルデータを挿入
    console.log('📝 Inserting sample data...');
    const result = await collection.insertMany(itinerariesWithObjectId);
    console.log(`✅ Inserted ${result.insertedCount} sample itineraries`);

    console.log('\n🎉 Database initialization completed successfully!');
    console.log('🎉 データベースの初期化が完了しました！');
  } catch (error) {
    console.error('❌ An error occurred:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

initDb().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
