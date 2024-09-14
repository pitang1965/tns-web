import { MongoClient } from 'mongodb';
import { sampleItineraries } from '../data/sampleData/sampleItineraries';
import dotenv from 'dotenv';

// 環境変数の読み込み
dotenv.config({ path: '.env.local' });

// MongoDB接続URI（環境変数から取得）
const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('MONGODB_URI is not defined in the environment variables.');
}

const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log('Connected successfully to MongoDB');

    const database = client.db('itinerary_db'); // データベース名を適切に設定
    const itineraries = database.collection('itineraries');

    // 既存のデータをクリア（オプション）
    await itineraries.deleteMany({});

    // サンプルデータの挿入
    const result = await itineraries.insertMany(sampleItineraries);
    console.log(`${result.insertedCount} documents were inserted`);
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
