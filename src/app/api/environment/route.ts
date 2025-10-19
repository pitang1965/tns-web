import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const mongoUri = process.env.MONGODB_URI || '';

  // データベース名を抽出して環境を判定
  let environment: 'development' | 'production' | 'unknown' = 'unknown';

  if (mongoUri.includes('itinerary_db_dev')) {
    environment = 'development';
  } else if (mongoUri.includes('itinerary_db')) {
    environment = 'production';
  }

  return NextResponse.json({ environment });
}
