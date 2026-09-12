import mongoose from 'mongoose';
import { ensureDbConnection } from '@/lib/database';
import ItineraryModel from '@/lib/models/Itinerary';
import { logger } from '@/lib/logger';
import {
  ServerItineraryDocument,
  ServerItineraryInsertDocument,
  ClientItineraryDocument,
  ClientItineraryInput,
  PublicItinerarySummary,
  toClientItinerary,
} from '@/data/schemas/itinerarySchema';
import { getCreatorHandle } from '@/lib/creatorHandle';
import { auth0 } from '@/lib/auth0';
import {
  isOwnedBy,
  normalizeOwnerEmail,
  ownerQuery,
  type OwnerIdentity,
} from '@/lib/itineraryOwnership';

async function getAuthenticatedUser() {
  const session = await auth0.getSession();
  if (!session?.user) {
    throw new Error('認証されていません');
  }
  return session.user;
}

/**
 * 旅程の閲覧アクセス可否を判定する（サーバー側の認可ガード）
 * - 公開旅程は誰でも閲覧可
 * - 非公開旅程は所有者、または共有相手のみ閲覧可
 *
 * クライアント側の useItineraryAccess は表示制御のみで認可の役割は持たないため、
 * データを返す前に必ずこの関数でガードすること。
 */
export function canAccessItinerary(
  itinerary: {
    isPublic?: boolean;
    owner?: { id?: string; email?: string } | null;
    sharedWith?: ({ id?: string } | null | undefined)[] | null;
  },
  user: OwnerIdentity | null | undefined,
): boolean {
  if (itinerary.isPublic) return true;
  if (!user?.sub) return false;
  // 所有者判定は sub だけでなく認証済みメールも見る（詳細は itineraryOwnership.ts）
  if (isOwnedBy(itinerary.owner, user)) return true;
  // 共有相手は sub のみで判定する。共有時に控えているのが sub だけのため。
  if (itinerary.sharedWith?.some((u) => u?.id === user.sub)) return true;
  return false;
}

export async function createItinerary(
  newItinerary: ClientItineraryInput,
): Promise<ClientItineraryDocument> {
  const user = await getAuthenticatedUser();
  await ensureDbConnection();
  const now = new Date();

  const docToInsert: ServerItineraryInsertDocument = {
    ...newItinerary,
    createdAt: now,
    updatedAt: now,
    owner: {
      id: user.sub,
      name: user.name || '',
      // 所有者判定でメールを突き合わせるため、保存時に正規化しておく
      email: normalizeOwnerEmail(user.email),
    },
  };

  const doc = await ItineraryModel.create(docToInsert);
  return toClientItinerary(doc.toObject() as ServerItineraryDocument);
}

export async function getItineraries(): Promise<ClientItineraryDocument[]> {
  const user = await getAuthenticatedUser();
  await ensureDbConnection();

  try {
    const itineraries = await ItineraryModel.find(ownerQuery(user))
      .sort({ updatedAt: -1 })
      .lean<ServerItineraryDocument[]>();

    return itineraries.map(toClientItinerary);
  } catch (error) {
    logger.error(
      error instanceof Error ? error : new Error('Error in getItineraries'),
    );
    return [];
  }
}

export async function getPublicItineraries(): Promise<
  PublicItinerarySummary[]
> {
  try {
    await ensureDbConnection();

    const itineraries = await ItineraryModel.find({ isPublic: true })
      .sort({ updatedAt: -1 })
      .lean<ServerItineraryDocument[]>();

    // 公開ページの payload に生PII（本名・メール・owner.id）を載せないため、
    // 作成者はサーバー側で匿名ハンドルに変換し、owner と sharedWith を除去する。
    return itineraries.map((doc) => {
      const handle = getCreatorHandle(doc.owner?.id);
      const { owner: _owner, sharedWith: _sharedWith, ...rest } =
        toClientItinerary(doc);
      return { ...rest, owner: { handle } };
    });
  } catch (error) {
    logger.error(
      error instanceof Error
        ? error
        : new Error('Error in getPublicItineraries'),
    );
    return [];
  }
}

export async function getItineraryById(
  id: string,
): Promise<ClientItineraryDocument | null> {
  await ensureDbConnection();

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log(`Invalid ObjectId format: ${id}`);
      return null;
    }

    const itinerary =
      await ItineraryModel.findById(id).lean<ServerItineraryDocument>();

    if (!itinerary) {
      console.log(`Itinerary not found for id: ${id}`);
      return null;
    }

    // サーバー側アクセス制御：非公開旅程は所有者・共有相手のみ閲覧可
    const session = await auth0.getSession();
    if (!canAccessItinerary(itinerary, session?.user)) {
      return null;
    }

    console.log(`Itinerary found: ${itinerary.title}`);
    return toClientItinerary(itinerary);
  } catch (error) {
    logger.error(
      error instanceof Error ? error : new Error('Error in getItineraryById'),
      { id },
    );
    return null;
  }
}

type ItineraryDayMetadata = {
  id: string;
  title?: string;
  description?: string;
  isPublic?: boolean;
  owner?: unknown;
  sharedWith?: unknown;
  totalDays?: number;
  dayPlanSummaries?: { date?: string; notes?: string }[];
};

export async function getItineraryWithDay(
  id: string,
  dayIndex: number,
): Promise<{ metadata: ItineraryDayMetadata; dayPlan: unknown } | null> {
  await ensureDbConnection();

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log(`Invalid ObjectId format: ${id}`);
      return null;
    }

    const objectId = new mongoose.Types.ObjectId(id);

    const pipeline = [
      { $match: { _id: objectId } },
      {
        $project: {
          title: 1,
          description: 1,
          isPublic: 1,
          owner: 1,
          sharedWith: 1,
          totalDays: { $size: '$dayPlans' },
          dayPlan: { $arrayElemAt: ['$dayPlans', dayIndex] },
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

    const result = await ItineraryModel.aggregate(pipeline);

    if (!result || result.length === 0) {
      console.log(`Itinerary not found for id: ${id}`);
      return null;
    }

    const itineraryData = result[0];

    // サーバー側アクセス制御：非公開旅程は所有者・共有相手のみ閲覧可
    const session = await auth0.getSession();
    if (!canAccessItinerary(itineraryData, session?.user)) {
      return null;
    }

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

    return { metadata, dayPlan: itineraryData.dayPlan };
  } catch (error) {
    logger.error(
      error instanceof Error
        ? error
        : new Error('Error in getItineraryWithDay'),
      { id, dayIndex },
    );
    return null;
  }
}

export async function updateItinerary(
  id: string,
  updatedData: ClientItineraryInput,
): Promise<ClientItineraryDocument> {
  const user = await getAuthenticatedUser();
  await ensureDbConnection();
  const now = new Date();

  try {
    const updateDoc = {
      title: updatedData.title,
      description: updatedData.description,
      numberOfDays: updatedData.numberOfDays,
      startDate: updatedData.startDate,
      isPublic: updatedData.isPublic,
      sharedWith: updatedData.sharedWith,
      updatedAt: now,
      dayPlans: updatedData.dayPlans.map((day) => ({
        ...day,
        notes: day.notes !== undefined ? day.notes : '',
      })),
    };

    const updatedDoc = await ItineraryModel.findOneAndUpdate(
      { _id: id, ...ownerQuery(user) },
      { $set: updateDoc },
      { new: true },
    ).lean<ServerItineraryDocument>();

    if (!updatedDoc) {
      throw new Error('旅程が見つかりません');
    }

    return toClientItinerary(updatedDoc);
  } catch (error) {
    logger.error(
      error instanceof Error ? error : new Error('Error in updateItinerary'),
      { id },
    );
    throw error;
  }
}

/**
 * 退会処理用：指定ユーザーに紐づく旅程データを完全に削除する。
 * - 所有旅程（公開・非公開を問わず）を全削除
 * - 他ユーザーの旅程の共有相手(sharedWith)から当該ユーザーを除去
 *
 * 削除対象は閲覧・編集できる範囲と同じ基準（sub または認証済みメール）にそろえる。
 * sub だけで消すと、別のログイン方法で作った自分の旅程が退会後も残り、
 * 「退会したのにデータが残っている」状態になるため。
 *
 * 注意: Auth0 のアカウント削除は現在のログイン接続のユーザーだけが対象で、
 * 別接続のユーザーは残る。またこの関数は sharedWith を sub でしか外せない
 * （共有時に控えているのが sub だけのため）。
 *
 * @returns 削除した所有旅程の件数
 */
export async function deleteAllItinerariesForUser(
  user: OwnerIdentity,
): Promise<number> {
  await ensureDbConnection();

  // 所有旅程を全削除
  const deleteResult = await ItineraryModel.deleteMany(ownerQuery(user));

  // 他人の旅程の共有相手から自分を除去
  if (user.sub) {
    await ItineraryModel.updateMany(
      { 'sharedWith.id': user.sub },
      { $pull: { sharedWith: { id: user.sub } } },
    );
  }

  return deleteResult.deletedCount ?? 0;
}

export async function getAllItineraries(): Promise<ClientItineraryDocument[]> {
  await ensureDbConnection();

  try {
    const itineraries = await ItineraryModel.find({})
      .sort({ updatedAt: -1 })
      .lean<ServerItineraryDocument[]>();

    return itineraries.map(toClientItinerary);
  } catch (error) {
    logger.error(
      error instanceof Error ? error : new Error('Error in getAllItineraries'),
    );
    return [];
  }
}
