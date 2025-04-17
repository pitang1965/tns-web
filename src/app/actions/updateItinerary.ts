'use server';

import { updateItinerary } from '@/lib/itineraries';
import { ClientItineraryInput } from '@/data/schemas/itinerarySchema';
import { getSession } from '@auth0/nextjs-auth0';

export async function updateItineraryAction(
  id: string,
  data: ClientItineraryInput
) {
  try {
    const session = await getSession();
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
        notes: day.notes || '',
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

    return { success: true, id: updatedItinerary.id };
  } catch (error) {
    console.error('Error updating itinerary:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to update itinerary',
    };
  }
}
