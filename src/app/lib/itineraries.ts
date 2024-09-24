import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import {
  ItineraryDocument,
  ItineraryClient,
  ItineraryInput,
  toItineraryClient,
} from '@/data/types/itinerary';
import { getSession } from '@auth0/nextjs-auth0';

// 認証済みユーザーのセッション情報を取得する関数
async function getAuthenticatedUser() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('認証されていません');
  }
  return session.user;
}

// データベース接続を取得する関数
async function getDatabase() {
  const client = await clientPromise;
  return client.db('itinerary_db');
}

export async function createItinerary(
  newItinerary: ItineraryInput
): Promise<ItineraryClient> {
  const user = await getAuthenticatedUser();
  const db = await getDatabase();
  const now = new Date();
  const itineraryToInsert: ItineraryDocument = {
    ...newItinerary,
    _id: new ObjectId(),
    createdAt: now,
    updatedAt: now,
    owner: {
      id: user.sub,
      name: user.name || '',
      email: user.email || '',
    },
  };
  const result = await db
    .collection<ItineraryDocument>('itineraries')
    .insertOne(itineraryToInsert);

  return toItineraryClient(itineraryToInsert);
}

export async function getItineraries(): Promise<ItineraryClient[]> {
  const user = await getAuthenticatedUser();
  const db = await getDatabase();

  const itineraries = await db
    .collection<ItineraryDocument>('itineraries')
    .find({ 'owner.id': user.sub })
    .toArray();

  return itineraries.map(toItineraryClient);
}

export async function getItineraryById(
  id: string
): Promise<ItineraryClient | null> {
  const user = await getAuthenticatedUser();
  const db = await getDatabase();

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
