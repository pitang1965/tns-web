import { NextResponse } from 'next/server';
import CampingSpot, { ICampingSpot } from '@/lib/models/CampingSpot';
import { ensureDbConnection } from '@/lib/database';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// 全スポットは公開データ(認証・PIIなし)で全員に同一。URLが単一のため
// Vercel CDNにs-maxageでキャッシュさせ、DBへの到達を抑える。
// 既存の公開契約 /api/v1/spots と同じ方針(モバイルアプリ用と揃える)。
// スポット追加・編集の反映は最大1時間遅延するが、地図用途では許容範囲。
const CACHE_CONTROL = 'public, s-maxage=3600, stale-while-revalidate=86400';

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

    return NextResponse.json(geoJSON, {
      headers: { 'Cache-Control': CACHE_CONTROL },
    });
  } catch (error) {
    logger.error(
      error instanceof Error
        ? error
        : new Error('Error fetching camping spots'),
    );
    return NextResponse.json(
      { error: 'Failed to fetch camping spots' },
      { status: 500 },
    );
  }
}
