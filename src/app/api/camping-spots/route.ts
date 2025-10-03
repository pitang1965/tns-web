import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import CampingSpot, { ICampingSpot } from '@/lib/models/CampingSpot';

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
    console.error('Error fetching camping spots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch camping spots' },
      { status: 500 }
    );
  }
}
