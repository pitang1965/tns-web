import { NextResponse } from 'next/server';
import CampingSpot, { ICampingSpot } from '@/lib/models/CampingSpot';
import { ensureDbConnection } from '@/lib/database';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await ensureDbConnection();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    // Get all spots (not filtering by isVerified to show all data)
    const spots = await CampingSpot.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean<ICampingSpot[]>();

    // Convert to GeoJSON format for map display
    const geoJSON = {
      type: 'FeatureCollection',
      features: spots.map((spot) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: spot.coordinates, // [lng, lat]
        },
        properties: {
          _id: spot._id?.toString(),
          name: spot.name,
          prefecture: spot.prefecture,
          type: spot.type,
          address: spot.address,
          url: spot.url,
          hasRoof: spot.hasRoof,
          hasPowerOutlet: spot.hasPowerOutlet,
          isFree: spot.pricing?.isFree,
          pricePerNight: spot.pricing?.pricePerNight,
        },
      })),
    };

    return NextResponse.json(geoJSON);
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error('Error fetching camping spots'));
    return NextResponse.json(
      { error: 'Failed to fetch camping spots' },
      { status: 500 }
    );
  }
}
