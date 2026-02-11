'use server';

import { updateItinerary } from '@/lib/itineraries';
import { ClientItineraryInput } from '@/data/schemas/itinerarySchema';
import { auth0 } from '@/lib/auth0';
import { logger } from '@/lib/logger';

export async function updateItineraryAction(
  id: string,
  data: ClientItineraryInput
) {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      throw new Error('認証されていません');
    }

    // Auth0のユーザー情報の存在チェック
    if (!session.user.sub) {
      throw new Error('ユーザーIDが見つかりません');
    }

    // 所有者情報を更新
    const updatedData = {
      ...data,
      startDate: data.startDate
        ? new Date(data.startDate).toISOString()
        : undefined,
      dayPlans: data.dayPlans.map((day) => ({
        ...day,
        // notesフィールドが存在しない場合は空文字列を設定
        notes: day.notes !== undefined ? day.notes : '',
        activities: day.activities.map((activity) => {
          // locationが空の場合は削除
          const newActivity = { ...activity };
          if (
            newActivity.place?.location?.latitude === null &&
            newActivity.place?.location?.longitude === null
          ) {
            newActivity.place.location = null;
          }
          return newActivity;
        }),
      })),
      // 所有者情報を維持
      owner: data.owner || {
        id: session.user.sub,
        name: session.user.name ?? '',
        email: session.user.email ?? '',
      },
    };

    const updatedItinerary = await updateItinerary(id, updatedData);

    if (!updatedItinerary || !updatedItinerary.id) {
      return {
        success: false,
        error: '旅程の更新に失敗しました（データが返されませんでした）',
      };
    }

    return { success: true, id: updatedItinerary.id };
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error('Error updating itinerary'), { id });
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to update itinerary',
    };
  }
}
