import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id);
}

// updatedAt のみを返す軽量エンドポイント
// キャッシュの鮮度チェックに使用する
export async function GET(
  _request: Request,
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

    const db = await getDb();
    const result = await db
      .collection('itineraries')
      .findOne(
        { _id: new ObjectId(id) },
        { projection: { updatedAt: 1, _id: 0 } },
      );

    if (!result) {
      return NextResponse.json(
        { error: 'Itinerary not found' },
        { status: 404 },
      );
    }

    const updatedAt =
      result.updatedAt instanceof Date
        ? result.updatedAt.toISOString()
        : String(result.updatedAt);

    return NextResponse.json({ updatedAt });
  } catch {
    return NextResponse.json({ error: 'Error fetching meta' }, { status: 500 });
  }
}
