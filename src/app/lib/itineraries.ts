import { ObjectId, WithoutId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import {
  ServerItineraryDocument,
  ServerItineraryInsertDocument,
  ClientItineraryDocument,
  ClientItineraryInput,
  toClientItinerary,
} from '@/data/schemas/itinerarySchema';
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
  newItinerary: ClientItineraryInput
): Promise<ClientItineraryDocument> {
  const user = await getAuthenticatedUser();
  const db = await getDatabase();
  const now = new Date();

  // WithoutIdを使用して_idを除外した型を定義
  const docToInsert: ServerItineraryInsertDocument = {
    ...newItinerary,
    createdAt: now,
    updatedAt: now,
    owner: {
      id: user.sub,
      name: user.name || '',
      email: user.email || '',
    },
  };

  // insertOneを実行
  const result = await db
    .collection<ServerItineraryDocument>('itineraries')
    .insertOne(docToInsert);

  // 挿入されたドキュメントを取得
  const insertedDoc = await db
    .collection<ServerItineraryDocument>('itineraries')
    .findOne({ _id: result.insertedId });

  if (!insertedDoc) {
    throw new Error('Failed to create itinerary');
  }

  return toClientItinerary(insertedDoc);
}

export async function getItineraries(): Promise<ClientItineraryDocument[]> {
  const user = await getAuthenticatedUser();
  const db = await getDatabase();

  const itineraries = await db
    .collection<ServerItineraryDocument>('itineraries')
    .find({ 'owner.id': user.sub })
    .toArray();

  // ObjectIdを文字列に変換
  const itinerariesWithStringId = itineraries.map((doc) => ({
    ...doc,
    _id: doc._id.toString(),
  }));

  return itinerariesWithStringId.map(toClientItinerary);
}

export async function getItineraryById(
  id: string
): Promise<ClientItineraryDocument | null> {
  const user = await getAuthenticatedUser();
  const db = await getDatabase();

  try {
    console.log('id: ', id);
    const objectId = new ObjectId(id);
    const itinerary = await db
      .collection<ServerItineraryDocument>('itineraries')
      .findOne({ _id: objectId.toString() });

    if (!itinerary) {
      console.log('itinerary is null');
      return null;
    }

    // console.log('itinerary: ', JSON.stringify(itinerary, null, 2));

    // ObjectIdを文字列に変換
    const itineraryWithStringId = {
      ...itinerary,
      _id: itinerary._id.toString(),
    };

    return toClientItinerary(itineraryWithStringId);
  } catch (error) {
    console.error('Error in getItineraryById:', error);
    return null;
  }
}

// 他の必要なAPI関数をここに追加
// 例: createItinerary, updateItinerary, deleteItinerary など
