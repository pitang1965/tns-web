import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import ItineraryModel from '@/lib/models/Itinerary';
import { ensureDbConnection } from '@/lib/database';
import { logger } from '@/lib/logger';
import {
  ServerItineraryDocument,
  toClientItinerary,
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

    const clientItinerary = toClientItinerary(itinerary);
    return NextResponse.json(clientItinerary);
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
