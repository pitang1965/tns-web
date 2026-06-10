import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import ItineraryModel from '@/lib/models/Itinerary';
import { ensureDbConnection } from '@/lib/database';
import { logger } from '@/lib/logger';
import { auth0 } from '@/lib/auth0';
import { canAccessItinerary } from '@/lib/itineraries';

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; dayIndex: string }> },
) {
  try {
    const { id, dayIndex } = await params;
    const dayIndexNum = parseInt(dayIndex, 10);

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid itinerary ID' },
        { status: 400 },
      );
    }

    if (isNaN(dayIndexNum) || dayIndexNum < 0) {
      return NextResponse.json({ error: 'Invalid day index' }, { status: 400 });
    }

    await ensureDbConnection();

    const itinerary = await ItineraryModel.findById(id)
      .select('dayPlans isPublic owner sharedWith')
      .lean<{
        dayPlans: unknown[];
        isPublic?: boolean;
        owner?: { id?: string };
        sharedWith?: { id?: string }[];
      }>();

    if (!itinerary) {
      return NextResponse.json(
        { error: 'Itinerary not found' },
        { status: 404 },
      );
    }

    // サーバー側アクセス制御：非公開旅程は所有者・共有相手のみ閲覧可
    // 存在の有無や日数を漏らさないため、権限がない場合も 404 を返す
    const session = await auth0.getSession();
    if (!canAccessItinerary(itinerary, session?.user?.sub)) {
      return NextResponse.json(
        { error: 'Itinerary not found' },
        { status: 404 },
      );
    }

    const totalDays = itinerary.dayPlans?.length || 0;
    console.log(
      `Total days in itinerary: ${totalDays}, requested day: ${dayIndexNum}`,
    );

    if (totalDays === 0) {
      return NextResponse.json(
        {
          error: 'NO_DAY_PLANS',
          message: 'この旅程にはまだ日程が登録されていません。',
          suggestion: '旅程を編集して日程を追加してください。',
          totalDays: 0,
        },
        { status: 400 },
      );
    }

    if (dayIndexNum >= totalDays) {
      return NextResponse.json(
        {
          error: 'DAY_INDEX_OUT_OF_RANGE',
          message: `指定された日付が範囲外です。`,
          details: `${
            dayIndexNum + 1
          }日目が指定されましたが、この旅程は${totalDays}日間です。`,
          totalDays,
        },
        { status: 400 },
      );
    }

    const objectId = new mongoose.Types.ObjectId(id);
    const pipeline = [
      { $match: { _id: objectId } },
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          isPublic: 1,
          owner: 1,
          sharedWith: 1,
          createdAt: 1,
          updatedAt: 1,
          totalDays: { $size: '$dayPlans' },
          dayPlanSummaries: {
            $map: {
              input: '$dayPlans',
              as: 'day',
              in: {
                date: '$$day.date',
                notes: '$$day.notes',
                activities: {
                  $map: {
                    input: { $ifNull: ['$$day.activities', []] },
                    as: 'activity',
                    in: {
                      id: '$$activity.id',
                      title: '$$activity.title',
                    },
                  },
                },
              },
            },
          },
          selectedDay: {
            $cond: {
              if: { $lt: [dayIndexNum, { $size: '$dayPlans' }] },
              then: { $arrayElemAt: ['$dayPlans', dayIndexNum] },
              else: null,
            },
          },
        },
      },
    ];

    const result = await ItineraryModel.aggregate(pipeline);

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: 'Itinerary not found' },
        { status: 404 },
      );
    }

    const itineraryData = result[0];
    console.log(`Selected day data found: ${!!itineraryData.selectedDay}`);

    if (itineraryData.selectedDay === null) {
      return NextResponse.json(
        {
          error: 'DAY_INDEX_OUT_OF_RANGE',
          message: `指定された日付が範囲外です。`,
          details: `${dayIndexNum + 1}日目が指定されましたが、この旅程は${
            itineraryData.totalDays
          }日間です。`,
          totalDays: itineraryData.totalDays,
        },
        { status: 400 },
      );
    }

    const response = {
      metadata: {
        id: itineraryData._id.toString(),
        title: itineraryData.title,
        description: itineraryData.description,
        isPublic: itineraryData.isPublic,
        owner: itineraryData.owner,
        sharedWith: itineraryData.sharedWith,
        totalDays: itineraryData.totalDays,
        createdAt: itineraryData.createdAt,
        updatedAt: itineraryData.updatedAt,
        dayPlanSummaries: itineraryData.dayPlanSummaries,
      },
      dayPlan: itineraryData.selectedDay,
      dayIndex: dayIndexNum,
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error(
      error instanceof Error ? error : new Error('Error fetching day data'),
    );
    return NextResponse.json(
      { error: 'Error fetching day data' },
      { status: 500 },
    );
  }
}
