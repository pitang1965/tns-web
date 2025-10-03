// ⚠️ WARNING: This script is DANGEROUS - it deletes ALL itineraries in the database!
// ⚠️ 警告：このスクリプトは危険です - データベース内の全旅程を削除します！
//
// This script has been commented out to prevent accidental data loss.
// If you need to initialize the database, please uncomment carefully and
// make sure you have a backup of your data first.
//
// このスクリプトは誤ってデータを失わないようにコメントアウトされています。
// データベースを初期化する必要がある場合は、慎重にコメントを外し、
// 必ず事前にデータのバックアップを取ってください。

/*
import { MongoClient, ObjectId } from 'mongodb';
// 注意：以下では＠/data... とはできない
import { sampleItineraries } from '../data/sampleData/sampleItineraries.js';
import dotenv from 'dotenv';

console.log('Script started');

// Load environment variables
dotenv.config({ path: '.env.local' });

async function initDb() {
  console.log('Initializing database');
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in the environment variables.');
  }

  console.log('Creating MongoDB client');
  const client = new MongoClient(uri);

  try {
    await client.connect();

    const database = client.db('itinerary_db');
    const collection = database.collection('itineraries');

    await collection.deleteMany({});

    // `_id` を `ObjectId` に変換
    const itinerariesWithObjectId = sampleItineraries.map((itinerary) => ({
      ...itinerary,
      _id: new ObjectId(itinerary._id), // `_id` を `ObjectId` 型に変換
    }));

    const result = await collection.insertMany(itinerariesWithObjectId);
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    await client.close();
  }
}

initDb().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
*/

console.log('⚠️  initDB.ts is disabled to prevent accidental data loss.');
console.log('⚠️  initDB.tsは誤ってデータを失わないように無効化されています。');
