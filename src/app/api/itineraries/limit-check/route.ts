import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { getItineraries } from '@/lib/itineraries';
import { getItineraryLimitStatus } from '@/lib/userUtils';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: '認証されていません' },
        { status: 401 }
      );
    }

    // ユーザーの旅程を取得
    const itineraries = await getItineraries();

    // 制限状況を取得
    const limitStatus = getItineraryLimitStatus(session.user, itineraries);

    return NextResponse.json({
      success: true,
      data: {
        canCreate: limitStatus.canCreate,
        currentCount: limitStatus.currentCount,
        limit: limitStatus.limit,
        remaining: limitStatus.remaining,
        isPremium: limitStatus.isPremium,
        itineraries: itineraries
      }
    });

  } catch (error) {
    console.error('Error checking itinerary limit:', error);
    return NextResponse.json(
      { error: '制限チェックに失敗しました' },
      { status: 500 }
    );
  }
}