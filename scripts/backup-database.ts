import { MongoClient } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// .env.localを読み込む
dotenv.config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('MONGODB_URI environment variable is not set');
  process.exit(1);
}

async function backupDatabase() {
  if (!uri) {
    console.error('MONGODB_URI is not defined');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const database = client.db('itinerary_db');
    const collection = database.collection('itineraries');

    // 全ての旅程を取得
    const itineraries = await collection.find({}).toArray();

    console.log(`\n取得した旅程数: ${itineraries.length}`);

    // バックアップディレクトリを作成
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // タイムスタンプ付きのファイル名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupFile = path.join(backupDir, `itineraries-backup-${timestamp}.json`);

    // JSONファイルに保存
    fs.writeFileSync(backupFile, JSON.stringify(itineraries, null, 2), 'utf-8');

    console.log(`\n✅ バックアップ完了!`);
    console.log(`ファイル: ${backupFile}`);
    console.log(`サイズ: ${(fs.statSync(backupFile).size / 1024).toFixed(2)} KB`);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

console.log('データベースのバックアップを開始します...\n');
backupDatabase();
