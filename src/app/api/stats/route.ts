import { NextResponse } from 'next/server';
import { ensureDbConnection } from '@/lib/database';
import CampingSpot from '@/lib/models/CampingSpot';
import CampingSpotSubmission from '@/lib/models/CampingSpotSubmission';
import ItineraryModel from '@/lib/models/Itinerary';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await ensureDbConnection();

    const [campingSpotCount, itineraryCount, submissionCount] =
      await Promise.all([
        CampingSpot.countDocuments({}),
        ItineraryModel.countDocuments({ isPublic: true }),
        CampingSpotSubmission.countDocuments({ status: 'approved' }),
      ]);

    return NextResponse.json({
      campingSpots: campingSpotCount,
      itineraries: itineraryCount,
      submissions: submissionCount,
    });
  } catch (error) {
    logger.error(
      error instanceof Error ? error : new Error('Error fetching stats'),
    );
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 },
    );
  }
}
