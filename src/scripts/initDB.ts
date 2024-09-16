import { MongoClient } from 'mongodb';
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
    console.log('Connecting to MongoDB');
    await client.connect();
    console.log('Connected successfully to MongoDB');

    const database = client.db('itinerary_db');
    const collection = database.collection('itineraries');

    console.log('Clearing existing data');
    await collection.deleteMany({});

    console.log('Inserting sample data');
    const result = await collection.insertMany(sampleItineraries);

    console.log(`${result.insertedCount} documents were inserted`);
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    console.log('Closing MongoDB connection');
    await client.close();
  }
}

initDb().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
