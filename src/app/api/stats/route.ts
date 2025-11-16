import { NextResponse } from 'next/server';
import { ensureDbConnection } from '@/lib/database';
import clientPromise from '@/lib/mongodb';
import CampingSpot from '@/lib/models/CampingSpot';
import CampingSpotSubmission from '@/lib/models/CampingSpotSubmission';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await ensureDbConnection();

    // Get MongoDB client for itineraries collection
    const client = await clientPromise;
    const db = client.db(); // 接続URIから自動取得

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
