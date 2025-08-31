/**
 * マイグレーションスクリプト：車中泊スポットタイプの変更
 * 既存データを以下のように変換：
 * - paid_parking → parking_lot
 * - park → parking_lot
 * - beach → parking_lot
 * - mountain → parking_lot
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/tns-web';

async function migrateCampingSpotTypes() {
  console.log('車中泊スポットタイプのマイグレーションを開始します...');

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('MongoDBに接続しました');

    const db = client.db();
    const collection = db.collection('campingspots');

    // 変換対象のタイプごとに処理
    const typeMapping = {
      paid_parking: 'parking_lot',
      park: 'parking_lot',
      beach: 'parking_lot',
      mountain: 'parking_lot',
    };

    for (const [oldType, newType] of Object.entries(typeMapping)) {
      const result = await collection.updateMany(
        { type: oldType },
        { $set: { type: newType } }
      );

      console.log(`${oldType} → ${newType}: ${result.modifiedCount}件更新`);
    }

    // 変換後の状況を確認
    console.log('\n変換後のタイプ別件数:');
    const pipeline = [
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ];

    const typeCounts = await collection.aggregate(pipeline).toArray();
    typeCounts.forEach(({ _id, count }) => {
      console.log(`  ${_id}: ${count}件`);
    });

    console.log('\nマイグレーションが完了しました');
  } catch (error) {
    console.error('マイグレーション中にエラーが発生しました:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('データベース接続を終了しました');
  }
}

// スクリプトが直接実行された場合にマイグレーションを実行
migrateCampingSpotTypes().catch(console.error);
