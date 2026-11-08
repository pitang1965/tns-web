import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { countItineraries } from '@/lib/itineraries';
import { getItineraryLimitStatus } from '@/lib/userUtils';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await auth0.getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: '認証されていません' },
        { status: 401 },
      );
    }

    const limitStatus = getItineraryLimitStatus(
      session.user,
      await countItineraries(),
    );

    return NextResponse.json({
      success: true,
      data: {
        canCreate: limitStatus.canCreate,
        currentCount: limitStatus.currentCount,
        limit: limitStatus.limit,
        remaining: limitStatus.remaining,
        isPremium: limitStatus.isPremium,
      },
    });
  } catch (error) {
    logger.error(
      error instanceof Error
        ? error
        : new Error('Error checking itinerary limit'),
    );
    return NextResponse.json(
      { error: '制限チェックに失敗しました' },
      { status: 500 },
    );
  }
}
