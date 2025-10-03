import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import clientPromise from '@/lib/mongodb';
import CampingSpot from '@/lib/models/CampingSpot';
import CampingSpotSubmission from '@/lib/models/CampingSpotSubmission';

export const dynamic = 'force-dynamic';

async function ensureDbConnection() {
  if (mongoose.connection.readyState === 0) {
    const uri = process.env.MONGODB_URI!;
    const dbName = 'itinerary_db';
    await mongoose.connect(uri, {
      dbName,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 10000,
    });
  }
}

export async function GET() {
  try {
    await ensureDbConnection();

    // Get MongoDB client for itineraries collection
    const client = await clientPromise;
    const db = client.db('itinerary_db');

    const [campingSpotCount, itineraryCount, submissionCount] = await Promise.all([
      CampingSpot.countDocuments({}), // Count all spots, not just verified
      db.collection('itineraries').countDocuments({ isPublic: true }),
      CampingSpotSubmission.countDocuments({ status: 'approved' }),
    ]);

    return NextResponse.json({
      campingSpots: campingSpotCount,
      itineraries: itineraryCount,
      submissions: submissionCount,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
