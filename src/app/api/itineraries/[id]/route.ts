import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { logger } from '@/lib/logger';
import {
  ServerItineraryDocument,
  toClientItinerary,
} from '@/data/schemas/itinerarySchema';

// ObjectIdの検証関数
function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ObjectId の検証
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid itinerary ID' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const itinerary = await db
      .collection('itineraries')
      .findOne({ _id: new ObjectId(id as string) });

    if (!itinerary) {
      return NextResponse.json(
        { error: 'Itinerary not found' },
        { status: 404 }
      );
    }

    // 型アサーションを使用して正しい型に変換
    const typedItinerary = itinerary as unknown as ServerItineraryDocument;

    // ServerItineraryDocumentからClientItineraryDocumentへ変換
    const clientItinerary = toClientItinerary(typedItinerary);

    return NextResponse.json(clientItinerary);
  } catch (error) {
    logger.error(
      error instanceof Error ? error : new Error('Error fetching itinerary'),
      { url: request.url }
    );
    return NextResponse.json(
      { error: 'Error fetching itinerary' },
      { status: 500 }
    );
  }
}
