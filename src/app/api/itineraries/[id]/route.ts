import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import ItineraryModel from '@/lib/models/Itinerary';
import { ensureDbConnection } from '@/lib/database';
import { logger } from '@/lib/logger';
import { auth0 } from '@/lib/auth0';
import { canAccessItinerary } from '@/lib/itineraries';
import {
  ServerItineraryDocument,
  toDetailItinerary,
} from '@/data/schemas/itinerarySchema';

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid itinerary ID' },
        { status: 400 },
      );
    }

    await ensureDbConnection();
    const itinerary = await ItineraryModel.findById(id).lean<ServerItineraryDocument>();

    if (!itinerary) {
      return NextResponse.json(
        { error: 'Itinerary not found' },
        { status: 404 },
      );
    }

    // サーバー側アクセス制御：非公開旅程は所有者・共有相手のみ閲覧可
    // 存在の有無を漏らさないため、権限がない場合も 404 を返す
    const session = await auth0.getSession();
    if (!canAccessItinerary(itinerary, session?.user?.sub)) {
      return NextResponse.json(
        { error: 'Itinerary not found' },
        { status: 404 },
      );
    }

    // 生PII（owner.name/email/id）と sharedWith を payload から除去し、
    // サーバー側で算出した所有者・共有判定の boolean のみを返す。
    const detailItinerary = toDetailItinerary(itinerary, session?.user?.sub);
    return NextResponse.json(detailItinerary);
  } catch (error) {
    logger.error(
      error instanceof Error ? error : new Error('Error fetching itinerary'),
      { url: request.url },
    );
    return NextResponse.json(
      { error: 'Error fetching itinerary' },
      { status: 500 },
    );
  }
}
