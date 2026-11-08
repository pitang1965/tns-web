/**
 * データベースバックアップスクリプト
 * 車中泊スポットデータをJSONファイルにエクスポート
 */

import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/tns-web';

async function backupDatabase() {
  console.log('データベースバックアップを開始します...');

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('MongoDBに接続しました');

    const db = client.db();
    console.log(`対象DB: ${db.databaseName}`);
    const collection = db.collection('campingspots');

    // データ件数確認
    const totalCount = await collection.countDocuments();
    console.log(`バックアップ対象: ${totalCount}件`);

    if (totalCount === 0) {
      console.log('データがありません。バックアップをスキップします。');
      return;
    }

    // 全データを取得
    const allData = await collection.find({}).toArray();

    // バックアップファイル名（タイムスタンプ付き）
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backups');
    const backupFile = path.join(
      backupDir,
      `campingspots-backup-${timestamp}.json`
    );

    // バックアップディレクトリ作成
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // JSONファイルに保存
    fs.writeFileSync(backupFile, JSON.stringify(allData, null, 2));

    console.log(`✅ バックアップ完了: ${backupFile}`);
    console.log(
      `データサイズ: ${(fs.statSync(backupFile).size / 1024).toFixed(1)} KB`
    );

    // バックアップ内容の概要表示
    console.log('\nバックアップ内容の確認:');

    // タイプ別件数
    const typeCounts = {};
    allData.forEach((item) => {
      typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
    });

    console.log('施設タイプ別件数:');
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}件`);
    });
  } catch (error) {
    console.error('バックアップ中にエラーが発生しました:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

backupDatabase().catch(console.error);
