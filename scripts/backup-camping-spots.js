/**
 * データベースバックアップスクリプト
 * 車中泊スポットデータをJSONファイルにエクスポート
 */

import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/tns-web';

// 未指定ならMONGODB_URI末尾のDB名が使われる（本番を既定にしない）
const DATABASE_NAME = process.env.DATABASE_NAME;

async function backupDatabase() {
  console.log('データベースバックアップを開始します...');

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('MongoDBに接続しました');

    const db = client.db(DATABASE_NAME);
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
    console.log('\\nバックアップ内容の確認:');

    // タイプ別件数
    const typeCounts = {};
    allData.forEach((item) => {
      typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
    });

    console.log('施設タイプ別件数:');
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}件`);
    });

    // 評価データの有無
    const hasQuietness = allData.filter(
      (item) => item.quietnessLevel != null
    ).length;
    const hasSecurity = allData.filter(
      (item) => item.securityLevel != null
    ).length;
    const hasOverall = allData.filter(
      (item) => item.overallRating != null
    ).length;

    console.log('\\n既存評価データ:');
    console.log(`  静けさレベル有り: ${hasQuietness}件`);
    console.log(`  治安レベル有り: ${hasSecurity}件`);
    console.log(`  総合評価有り: ${hasOverall}件`);

    console.log(
      '\\n🎯 バックアップが完了しました。マイグレーションを実行できます。'
    );
  } catch (error) {
    console.error('バックアップ中にエラーが発生しました:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// 復元用のヘルパー関数も提供
async function restoreDatabase(backupFile) {
  console.log(`バックアップファイルから復元: ${backupFile}`);

  if (!fs.existsSync(backupFile)) {
    console.error('バックアップファイルが見つかりません:', backupFile);
    return;
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(DATABASE_NAME);
    console.log(`対象DB: ${db.databaseName}`);
    const collection = db.collection('campingspots');

    // 既存データを削除（注意！）
    console.log('既存データを削除しています...');
    await collection.deleteMany({});

    // バックアップから復元
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

    if (backupData.length > 0) {
      await collection.insertMany(backupData);
      console.log(`✅ 復元完了: ${backupData.length}件`);
    }
  } catch (error) {
    console.error('復元中にエラーが発生しました:', error);
  } finally {
    await client.close();
  }
}

// コマンドライン引数の処理
const command = process.argv[2];

if (command === 'restore' && process.argv[3]) {
  restoreDatabase(process.argv[3]).catch(console.error);
} else {
  backupDatabase().catch(console.error);
}

export { backupDatabase, restoreDatabase };
