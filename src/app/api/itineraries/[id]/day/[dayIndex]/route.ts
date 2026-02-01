import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// ObjectIdの検証関数
function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; dayIndex: string }> }
) {
  try {
    const { id, dayIndex } = await params;
    const dayIndexNum = parseInt(dayIndex, 10);

    // パラメータの検証
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid itinerary ID' },
        { status: 400 }
      );
    }

    if (isNaN(dayIndexNum) || dayIndexNum < 0) {
      return NextResponse.json({ error: 'Invalid day index' }, { status: 400 });
    }

    const db = await getDb();

    // まず基本的な情報を取得して日数をチェック
    const itinerary = await db
      .collection('itineraries')
      .findOne(
        { _id: new ObjectId(id) },
        { projection: { dayPlans: { $size: '$dayPlans' } } }
      );

    if (!itinerary) {
      return NextResponse.json(
        { error: 'Itinerary not found' },
        { status: 404 }
      );
    }

    const totalDays = itinerary.dayPlans || 0;
    console.log(
      `Total days in itinerary: ${totalDays}, requested day: ${dayIndexNum}`
    );

    // dayPlansが空の場合の特別処理
    if (totalDays === 0) {
      return NextResponse.json(
        {
          error: 'NO_DAY_PLANS',
          message: 'この旅程にはまだ日程が登録されていません。',
          suggestion: '旅程を編集して日程を追加してください。',
          totalDays: 0,
        },
        { status: 400 }
      );
    }

    // 0ベースインデックスなので、totalDaysと比較する必要がある
    if (dayIndexNum >= totalDays) {
      return NextResponse.json(
        {
          error: 'DAY_INDEX_OUT_OF_RANGE',
          message: `指定された日付が範囲外です。`,
          details: `${
            dayIndexNum + 1
          }日目が指定されましたが、この旅程は${totalDays}日間です。`,
          totalDays: totalDays,
        },
        { status: 400 }
      );
    }

    // MongoDB集約パイプラインを使用して効率的にデータを取得
    const pipeline = [
      { $match: { _id: new ObjectId(id) } },
      {
        $project: {
          // 基本的なメタデータ
          _id: 1,
          title: 1,
          description: 1,
          isPublic: 1,
          owner: 1,
          sharedWith: 1,
          createdAt: 1,
          updatedAt: 1,
          // 日数計算
          totalDays: { $size: '$dayPlans' },
          // 目次用の軽量な日程サマリー
          dayPlanSummaries: {
            $map: {
              input: '$dayPlans',
              as: 'day',
              in: {
                date: '$$day.date',
                notes: '$$day.notes',
                activities: {
                  $map: {
                    input: {
                      $ifNull: ['$$day.activities', []],
                    },
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
          // 指定した日のデータのみ
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

    const result = await db
      .collection('itineraries')
      .aggregate(pipeline)
      .toArray();

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: 'Itinerary not found' },
        { status: 404 }
      );
    }

    const itineraryData = result[0];
    console.log(`Selected day data found: ${!!itineraryData.selectedDay}`);

    // 指定された日が範囲外の場合
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
        { status: 400 }
      );
    }

    // レスポンスオブジェクトを構築
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
    console.error('Error fetching day data: ', error);
    return NextResponse.json(
      { error: 'Error fetching day data' },
      { status: 500 }
    );
  }
}
