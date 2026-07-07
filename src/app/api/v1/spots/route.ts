import { NextResponse } from 'next/server';
import CampingSpot, { ICampingSpot } from '@/lib/models/CampingSpot';
import { ensureDbConnection } from '@/lib/database';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// /api/v1 は配布済みモバイルアプリが依存する公開契約。
// レスポンス形式の破壊的変更は禁止(docs/adr/0006-versioned-mobile-api.md)
type SpotV1 = {
  id: string;
  name: string;
  type: ICampingSpot['type'];
  coordinates: [number, number]; // [lng, lat]
  prefecture: string;
  isFree: boolean;
  pricePerNight?: number;
  isOvernightProhibited: boolean;
  elevation: number; // meters
  distanceToToilet?: number; // meters(充足率~55%、欠損前提でUI設計すること)
  distanceToConvenience?: number; // meters
  distanceToBath?: number; // meters
};

type SpotsV1Response = {
  version: 1;
  generatedAt: string;
  spots: SpotV1[];
};

// 全件で約1,900件・gzip後~70KB(2026-07時点)。URLが単一のため
// Vercel CDNにs-maxageでキャッシュさせ、DBへの到達を1時間に1回に抑える
const CACHE_CONTROL = 'public, s-maxage=3600, stale-while-revalidate=86400';

export async function GET() {
  try {
    await ensureDbConnection();

    const spots = await CampingSpot.find(
      {},
      {
        name: 1,
        type: 1,
        coordinates: 1,
        prefecture: 1,
        'pricing.isFree': 1,
        'pricing.pricePerNight': 1,
        isOvernightProhibited: 1,
        elevation: 1,
        distanceToToilet: 1,
        distanceToConvenience: 1,
        distanceToBath: 1,
      },
    ).lean<ICampingSpot[]>();

    const body: SpotsV1Response = {
      version: 1,
      generatedAt: new Date().toISOString(),
      spots: spots.map((spot) => ({
        id: spot._id?.toString() ?? '',
        name: spot.name,
        type: spot.type,
        coordinates: spot.coordinates,
        prefecture: spot.prefecture,
        isFree: spot.pricing?.isFree ?? true,
        pricePerNight: spot.pricing?.pricePerNight,
        isOvernightProhibited: spot.isOvernightProhibited ?? false,
        elevation: spot.elevation,
        distanceToToilet: spot.distanceToToilet,
        distanceToConvenience: spot.distanceToConvenience,
        distanceToBath: spot.distanceToBath,
      })),
    };

    return NextResponse.json(body, {
      headers: { 'Cache-Control': CACHE_CONTROL },
    });
  } catch (error) {
    logger.error(
      error instanceof Error ? error : new Error('Error fetching v1 spots'),
    );
    return NextResponse.json(
      { error: 'スポット一覧の取得に失敗しました' },
      { status: 500 },
    );
  }
}
