import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import {
  ItineraryDocument,
  ItineraryClient,
  ItineraryInput,
  toItineraryClient,
} from '@/data/types/itinerary';

export async function createItinerary(
  newItinerary: ItineraryInput
): Promise<ItineraryClient> {
  const client = await clientPromise;
  const db = client.db('itinerary_db');
  const now = new Date();
  const itineraryToInsert: ItineraryDocument = {
    ...newItinerary,
    _id: new ObjectId(),
    createdAt: now,
    updatedAt: now,
  };
  const result = await db
    .collection<ItineraryDocument>('itineraries')
    .insertOne(itineraryToInsert);

  return toItineraryClient(itineraryToInsert);
}

export async function getItineraries(): Promise<ItineraryClient[]> {
  const client = await clientPromise;
  const db = client.db('itinerary_db');

  const itineraries = await db
    .collection<ItineraryDocument>('itineraries')
    .find({})
    .toArray();

  return itineraries.map(toItineraryClient);
}

export async function getItineraryById(
  id: string
): Promise<ItineraryClient | null> {
  const client = await clientPromise;
  const db = client.db('itinerary_db');

  try {
    console.log('id: ', id);
    const objectId = new ObjectId(id);
    const itinerary = await db
      .collection<ItineraryDocument>('itineraries')
      .findOne({ _id: objectId });

    if (!itinerary) {
      console.log('itinerary is null');
      return null;
    }

    // console.log('itinerary: ', JSON.stringify(itinerary, null, 2));

    return toItineraryClient(itinerary);
  } catch (error) {
    console.error('Error in getItineraryById:', error);
    return null;
  }
}

// 他の必要なAPI関数をここに追加
// 例: createItinerary, updateItinerary, deleteItinerary など
