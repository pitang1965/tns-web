/**
 * 車中泊スポットのデータを新しいスキーマに対応するためのマイグレーションスクリプト
 * 任意フィールドのデフォルト値をundefinedに変更
 */

const { MongoClient } = require('mongodb');

async function migrateCampingSpots() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI environment variable is required');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('itinerary_db');
    const collection = db.collection('campingspots');

    // 既存のドキュメントの数を確認
    const totalDocs = await collection.countDocuments();
    console.log(`Total camping spots: ${totalDocs}`);

    // オプショナルフィールドのデフォルト値を削除
    const updateResult = await collection.updateMany(
      {}, // すべてのドキュメント
      {
        $unset: {
          distanceToToilet: '', // 0だった場合は削除
          quietnessLevel: '', // デフォルト値を削除
          securityLevel: '', // デフォルト値を削除
          overallRating: '', // デフォルト値を削除
          capacity: '', // デフォルト値を削除
          notes: '', // 空文字列の場合は削除
        },
      }
    );

    console.log(`Updated ${updateResult.modifiedCount} documents`);

    // 特定の条件でフィールドを削除（例：デフォルト値が設定されている場合）
    const cleanupOperations = [
      {
        filter: { distanceToToilet: 0 },
        update: { $unset: { distanceToToilet: '' } },
        description: 'Remove distanceToToilet with value 0',
      },
      {
        filter: { quietnessLevel: 1 },
        update: { $unset: { quietnessLevel: '' } },
        description: 'Remove quietnessLevel with default value 1',
      },
      {
        filter: { securityLevel: 1 },
        update: { $unset: { securityLevel: '' } },
        description: 'Remove securityLevel with default value 1',
      },
      {
        filter: { overallRating: 1 },
        update: { $unset: { overallRating: '' } },
        description: 'Remove overallRating with default value 1',
      },
      {
        filter: { capacity: 1 },
        update: { $unset: { capacity: '' } },
        description: 'Remove capacity with default value 1',
      },
      {
        filter: { notes: '' },
        update: { $unset: { notes: '' } },
        description: 'Remove empty notes field',
      },
    ];

    for (const operation of cleanupOperations) {
      const result = await collection.updateMany(
        operation.filter,
        operation.update
      );
      console.log(
        `${operation.description}: ${result.modifiedCount} documents updated`
      );
    }

    // 更新後の状態を確認
    console.log('\nSample documents after migration:');
    const samples = await collection.find({}).limit(3).toArray();
    samples.forEach((doc, index) => {
      console.log(`Document ${index + 1}:`, {
        name: doc.name,
        distanceToToilet: doc.distanceToToilet,
        quietnessLevel: doc.quietnessLevel,
        securityLevel: doc.securityLevel,
        overallRating: doc.overallRating,
        capacity: doc.capacity,
        notes: doc.notes,
      });
    });
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// 環境変数を.env.localから読み込み
require('dotenv').config({ path: '.env.local' });

migrateCampingSpots();
