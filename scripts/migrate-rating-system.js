/**
 * マイグレーションスクリプト：評価システムの更新
 *
 * 段階1: 新しい評価システムフィールドを既存データに追加
 * - security: { hasGate, hasLighting, hasStaff }
 * - nightNoise: { hasNoiseIssues, nearBusyRoad, isQuietArea }
 *
 * 既存の quietnessLevel, securityLevel, overallRating は保持（段階的廃止）
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/tns-web';

// MongoDB Atlasの場合、データベース名を明示的に指定
const DATABASE_NAME = process.env.DATABASE_NAME || 'itinerary_db';

async function migrateRatingSystem() {
  console.log('評価システムのマイグレーションを開始します...');

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('MongoDBに接続しました');

    const db = client.db(DATABASE_NAME);
    const collection = db.collection('campingspots');

    // 既存データ数を確認
    const totalCount = await collection.countDocuments();
    console.log(`対象データ数: ${totalCount}件`);

    // Step 1: 新しいsecurityフィールドを追加
    console.log('\\n== Step 1: securityフィールドの追加 ==');

    const securityResult = await collection.updateMany(
      { security: { $exists: false } },
      {
        $set: {
          security: {
            hasGate: false,
            hasLighting: false,
            hasStaff: false,
          },
        },
      }
    );
    console.log(`security フィールド追加: ${securityResult.modifiedCount}件`);

    // Step 2: 新しいnightNoiseフィールドを追加
    console.log('\\n== Step 2: nightNoiseフィールドの追加 ==');

    const nightNoiseResult = await collection.updateMany(
      { nightNoise: { $exists: false } },
      {
        $set: {
          nightNoise: {
            hasNoiseIssues: false,
            nearBusyRoad: false,
            isQuietArea: false,
          },
        },
      }
    );
    console.log(
      `nightNoise フィールド追加: ${nightNoiseResult.modifiedCount}件`
    );

    // Step 3: 既存のhasGateフィールドから新しいsecurity.hasGateに値をコピー
    console.log('\\n== Step 3: 既存hasGateデータの移行 ==');

    const hasGateTrue = await collection.updateMany(
      { hasGate: true, 'security.hasGate': false },
      { $set: { 'security.hasGate': true } }
    );
    console.log(
      `hasGate=true のデータを security.hasGate に移行: ${hasGateTrue.modifiedCount}件`
    );

    // Step 4: 施設タイプ別のデフォルト値設定（推論）
    console.log('\\n== Step 4: 施設タイプ別推論設定 ==');

    // RVパーク、道の駅、SA/PAは管理人がいる可能性が高い
    const staffedTypes = ['rv_park', 'roadside_station', 'sa_pa'];
    const staffResult = await collection.updateMany(
      {
        type: { $in: staffedTypes },
        'security.hasStaff': false,
      },
      { $set: { 'security.hasStaff': true } }
    );
    console.log(`管理型施設の hasStaff 設定: ${staffResult.modifiedCount}件`);

    // 幹線道路沿い（SA/PA）は交通騒音がある可能性が高い
    const busyRoadResult = await collection.updateMany(
      {
        type: { $in: ['sa_pa'] },
        'nightNoise.nearBusyRoad': false,
      },
      { $set: { 'nightNoise.nearBusyRoad': true } }
    );
    console.log(
      `SA/PA の nearBusyRoad 設定: ${busyRoadResult.modifiedCount}件`
    );

    // Step 5: 更新後の状況確認
    console.log('\\n== 更新後の状況確認 ==');

    const updatedCount = await collection.countDocuments({
      security: { $exists: true },
      nightNoise: { $exists: true },
    });
    console.log(
      `新システムフィールドを持つデータ: ${updatedCount}件 / ${totalCount}件`
    );

    // セキュリティ機能の分布
    const securityStats = await collection
      .aggregate([
        {
          $group: {
            _id: null,
            hasGate: { $sum: { $cond: ['$security.hasGate', 1, 0] } },
            hasLighting: { $sum: { $cond: ['$security.hasLighting', 1, 0] } },
            hasStaff: { $sum: { $cond: ['$security.hasStaff', 1, 0] } },
          },
        },
      ])
      .toArray();

    if (securityStats.length > 0) {
      const stats = securityStats[0];
      console.log('\\nセキュリティ機能分布:');
      console.log(`  ゲート有り: ${stats.hasGate}件`);
      console.log(`  照明十分: ${stats.hasLighting}件`);
      console.log(`  管理人有り: ${stats.hasStaff}件`);
    }

    // 夜間騒音要因の分布
    const noiseStats = await collection
      .aggregate([
        {
          $group: {
            _id: null,
            hasNoiseIssues: {
              $sum: { $cond: ['$nightNoise.hasNoiseIssues', 1, 0] },
            },
            nearBusyRoad: {
              $sum: { $cond: ['$nightNoise.nearBusyRoad', 1, 0] },
            },
            isQuietArea: { $sum: { $cond: ['$nightNoise.isQuietArea', 1, 0] } },
          },
        },
      ])
      .toArray();

    if (noiseStats.length > 0) {
      const stats = noiseStats[0];
      console.log('\\n夜間環境分布:');
      console.log(`  騒音問題有り: ${stats.hasNoiseIssues}件`);
      console.log(`  交通量多い道路近く: ${stats.nearBusyRoad}件`);
      console.log(`  静かなエリア: ${stats.isQuietArea}件`);
    }

    console.log('\\n✅ マイグレーションが完了しました');
    console.log('\\n📝 次のステップ:');
    console.log('1. 新しい管理画面で客観的データを入力開始');
    console.log('2. 十分なデータが蓄積された後、旧フィールド削除を検討');
    console.log(
      '3. 既存の quietnessLevel, securityLevel, overallRating は当面保持'
    );
  } catch (error) {
    console.error('マイグレーション中にエラーが発生しました:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\\nデータベース接続を終了しました');
  }
}

// スクリプトが直接実行された場合にマイグレーションを実行
const isMainModule = process.argv[1] && import.meta.url.endsWith(process.argv[1]);
if (isMainModule || process.argv[1]?.includes('migrate-rating-system.js')) {
  migrateRatingSystem().catch(console.error);
}

export { migrateRatingSystem };
