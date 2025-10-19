import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const mongoUri = process.env.MONGODB_URI || '';

    // データベース名を抽出して環境を判定
    let environment: 'development' | 'production' | 'unknown' = 'unknown';

    if (mongoUri.includes('itinerary_db_dev')) {
      environment = 'development';
    } else if (mongoUri.includes('itinerary_db')) {
      environment = 'production';
    }

    return NextResponse.json({ environment }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error in /api/environment:', error);
    // エラー時は unknown を返す
    return NextResponse.json({ environment: 'unknown' }, { status: 200 });
  }
}
