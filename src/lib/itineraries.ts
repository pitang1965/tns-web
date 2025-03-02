import { ObjectId } from 'mongodb';
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

  // ServerItineraryInsertDocument型を使用してデータベースに挿入するドキュメントを準備
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

export async function updateItinerary(
  id: string,
  updatedData: ClientItineraryInput
): Promise<ClientItineraryDocument> {
  const user = await getAuthenticatedUser();
  const db = await getDatabase();
  const now = new Date();

  try {
    const objectId = new ObjectId(id);

    // 旅程が実際に存在するか確認
    const existingDoc = await db
      .collection<ServerItineraryDocument>('itineraries')
      .findOne({ _id: objectId as any });

    console.log('Existing document:', existingDoc);

    if (!existingDoc) {
      throw new Error('旅程が見つかりません');
    }

    // 所有者が一致するか確認
    if (existingDoc.owner.id !== user.sub) {
      throw new Error('この旅程を更新する権限がありません');
    }

    // 更新するドキュメントの準備
    const updateDoc = {
      $set: {
        ...updatedData,
        updatedAt: now,
      },
    };

    // 所有者が一致する場合のみ更新を許可する（ObjectId型を使用）
    const result = await db
      .collection<ServerItineraryDocument>('itineraries')
      .updateOne({ _id: objectId as any, 'owner.id': user.sub }, updateDoc);

    if (result.matchedCount === 0) {
      throw new Error('旅程の更新に失敗しました');
    }

    // 更新されたドキュメントを取得
    const updatedDoc = await db
      .collection<ServerItineraryDocument>('itineraries')
      .findOne({ _id: objectId as any });

    if (!updatedDoc) {
      throw new Error('更新された旅程の取得に失敗しました');
    }

    // ObjectIdを文字列に変換
    const updatedWithStringId = {
      ...updatedDoc,
      _id: updatedDoc._id.toString(),
    };

    return toClientItinerary(updatedWithStringId);
  } catch (error) {
    console.error('Error in updateItinerary:', error);
    throw error;
  }
}

// TODO: 他の必要なAPI関数をここに追加
// 例: deleteItinerary など
