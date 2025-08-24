/**
 * データベースの実際のデータを確認するスクリプト
 */

const { MongoClient } = require('mongodb');

async function checkDatabaseData() {
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

    // すべてのドキュメントを取得
    const docs = await collection.find({}).toArray();
    console.log(`Found ${docs.length} camping spots`);

    docs.forEach((doc, index) => {
      console.log(`\n--- Document ${index + 1} ---`);
      console.log('_id:', doc._id.toString());
      console.log('name:', doc.name);
      console.log('distanceToToilet:', doc.distanceToToilet, '(type:', typeof doc.distanceToToilet, ')');
      console.log('quietnessLevel:', doc.quietnessLevel, '(type:', typeof doc.quietnessLevel, ')');
      console.log('securityLevel:', doc.securityLevel, '(type:', typeof doc.securityLevel, ')');
      console.log('overallRating:', doc.overallRating, '(type:', typeof doc.overallRating, ')');
      console.log('capacity:', doc.capacity, '(type:', typeof doc.capacity, ')');
      console.log('notes:', doc.notes, '(type:', typeof doc.notes, ')');

      // JSON形式でも表示
      console.log('\nRaw JSON:');
      console.log(JSON.stringify({
        name: doc.name,
        distanceToToilet: doc.distanceToToilet,
        quietnessLevel: doc.quietnessLevel,
        securityLevel: doc.securityLevel,
        overallRating: doc.overallRating,
        capacity: doc.capacity,
        notes: doc.notes
      }, null, 2));
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// 環境変数を.env.localから読み込み
require('dotenv').config({ path: '.env.local' });

checkDatabaseData();