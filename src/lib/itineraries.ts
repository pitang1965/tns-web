import mongoose from 'mongoose';
import { ensureDbConnection } from '@/lib/database';
import ItineraryModel from '@/lib/models/Itinerary';
import { logger } from '@/lib/logger';
import {
  ServerItineraryDocument,
  ServerItineraryInsertDocument,
  ClientItineraryDocument,
  ClientItineraryInput,
  toClientItinerary,
} from '@/data/schemas/itinerarySchema';
import { auth0 } from '@/lib/auth0';

async function getAuthenticatedUser() {
  const session = await auth0.getSession();
  if (!session?.user) {
    throw new Error('認証されていません');
  }
  return session.user;
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
      email: user.email || '',
    },
  };

  const doc = await ItineraryModel.create(docToInsert);
  return toClientItinerary(doc.toObject() as ServerItineraryDocument);
}

export async function getItineraries(): Promise<ClientItineraryDocument[]> {
  const user = await getAuthenticatedUser();
  await ensureDbConnection();

  try {
    const itineraries = await ItineraryModel.find({ 'owner.id': user.sub })
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
  ClientItineraryDocument[]
> {
  try {
    await ensureDbConnection();

    const itineraries = await ItineraryModel.find({ isPublic: true })
      .sort({ updatedAt: -1 })
      .lean<ServerItineraryDocument[]>();

    return itineraries.map(toClientItinerary);
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

export async function getItineraryWithDay(
  id: string,
  dayIndex: number,
): Promise<{ metadata: any; dayPlan: any } | null> {
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
      { _id: id, 'owner.id': user.sub },
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
