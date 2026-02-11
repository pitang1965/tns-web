import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import { logger } from '@/lib/logger';
import {
  ServerItineraryDocument,
  ServerItineraryInsertDocument,
  ClientItineraryDocument,
  ClientItineraryInput,
  toClientItinerary,
} from '@/data/schemas/itinerarySchema';
import { auth0 } from '@/lib/auth0';

// 認証済みユーザーのセッション情報を取得する関数
async function getAuthenticatedUser() {
  const session = await auth0.getSession();
  if (!session?.user) {
    throw new Error('認証されていません');
  }
  return session.user;
}

// データベース接続を取得する関数
// getDb()は明示的にデータベース名を指定するため、接続URIの解析に依存しない
async function getDatabase() {
  return getDb();
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

  try {
    const itineraries = await db
      .collection<ServerItineraryDocument>('itineraries')
      .find({ 'owner.id': user.sub })
      .toArray();

    return itineraries.map(toClientItinerary);
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error('Error in getItineraries'));
    return [];
  }
}

export async function getPublicItineraries(): Promise<
  ClientItineraryDocument[]
> {
  try {
    const db = await getDatabase();

    const itineraries = await db
      .collection<ServerItineraryDocument>('itineraries')
      .find({ isPublic: true })
      .sort({ updatedAt: -1 })
      .toArray();

    return itineraries.map(toClientItinerary);
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error('Error in getPublicItineraries'));
    // Facebook Webview やネットワークエラーに対するフォールバック
    // 空配列を返してページは正常に表示させる
    return [];
  }
}

// 以下の関数はサーバーサイドでのみ使用します
export async function getItineraryById(
  id: string
): Promise<ClientItineraryDocument | null> {
  const db = await getDb();

  try {
    // 有効なObjectIdかチェック
    if (!ObjectId.isValid(id)) {
      console.log(`Invalid ObjectId format: ${id}`);
      return null;
    }

    // ObjectIdを正しく使用
    const objectId = new ObjectId(id);
    console.log(`Finding itinerary with _id: ${objectId}`);

    const itinerary = await db
      .collection<ServerItineraryDocument>('itineraries')
      .findOne({ _id: objectId });

    if (!itinerary) {
      console.log(`Itinerary not found for id: ${id}`);
      return null;
    }

    console.log(`Itinerary found: ${itinerary.title}`);

    // toClientItinerary関数を使用して変換
    return toClientItinerary(itinerary);
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error('Error in getItineraryById'), { id });
    return null;
  }
}

export async function getItineraryWithDay(
  id: string,
  dayIndex: number
): Promise<{ metadata: any; dayPlan: any } | null> {
  const db = await getDb();

  try {
    // 有効なObjectIdかチェック
    if (!ObjectId.isValid(id)) {
      console.log(`Invalid ObjectId format: ${id}`);
      return null;
    }

    const objectId = new ObjectId(id);

    // MongoDB集約パイプラインを使用して効率的にデータを取得
    const pipeline = [
      { $match: { _id: objectId } },
      {
        $project: {
          // 基本的なメタデータのみ取得
          title: 1,
          description: 1,
          isPublic: 1,
          owner: 1,
          sharedWith: 1,
          totalDays: { $size: '$dayPlans' },
          // 指定した日のデータのみ取得
          dayPlan: { $arrayElemAt: ['$dayPlans', dayIndex] },
          // 全日程のタイトルと日付のみを取得（目次用）
          dayPlanSummaries: {
            $map: {
              input: '$dayPlans',
              as: 'day',
              in: {
                date: '$$day.date',
                notes: '$$day.notes',
              },
            },
          },
        },
      },
    ];

    const result = await db
      .collection<ServerItineraryDocument>('itineraries')
      .aggregate(pipeline)
      .toArray();

    if (!result || result.length === 0) {
      console.log(`Itinerary not found for id: ${id}`);
      return null;
    }

    const itineraryData = result[0];

    // メタデータと現在の日のデータを分離
    const metadata = {
      id: itineraryData._id.toString(),
      title: itineraryData.title,
      description: itineraryData.description,
      isPublic: itineraryData.isPublic,
      owner: itineraryData.owner,
      sharedWith: itineraryData.sharedWith,
      totalDays: itineraryData.totalDays,
      dayPlanSummaries: itineraryData.dayPlanSummaries,
    };

    // 指定された日のデータ
    const dayPlan = itineraryData.dayPlan;

    return { metadata, dayPlan };
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error('Error in getItineraryWithDay'), { id, dayIndex });
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
      title: updatedData.title,
      description: updatedData.description,
      numberOfDays: updatedData.numberOfDays,
      startDate: updatedData.startDate,
      isPublic: updatedData.isPublic,
      sharedWith: updatedData.sharedWith,
      updatedAt: now,
      // dayPlansの各要素に対して、新しいnotesを使用
      dayPlans: updatedData.dayPlans.map((day) => ({
        ...day,
        // notesフィールドが存在しない場合は空文字列を設定
        notes: day.notes !== undefined ? day.notes : '',
      })),
    };

    console.log('更新するドキュメント:', JSON.stringify(updateDoc, null, 2));

    // 所有者が一致する場合のみ更新を許可する（ObjectId型を使用）
    const result = await db
      .collection<ServerItineraryDocument>('itineraries')
      .updateOne(
        { _id: objectId as any, 'owner.id': user.sub },
        { $set: updateDoc }
      );

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
    logger.error(error instanceof Error ? error : new Error('Error in updateItinerary'), { id });
    throw error;
  }
}

// 管理者用：全ての旅程を取得
export async function getAllItineraries(): Promise<ClientItineraryDocument[]> {
  const db = await getDatabase();

  try {
    const itineraries = await db
      .collection<ServerItineraryDocument>('itineraries')
      .find({})
      .sort({ updatedAt: -1 })
      .toArray();

    return itineraries.map(toClientItinerary);
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error('Error in getAllItineraries'));
    return [];
  }
}
