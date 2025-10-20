'use server';

import { createItinerary, getItineraries } from '@/lib/itineraries';
import { ClientItineraryInput } from '@/data/schemas/itinerarySchema';
import { auth0 } from '@/lib/auth0';
import { canCreateItinerary } from '@/lib/userUtils';

export async function createItineraryAction(data: ClientItineraryInput) {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      throw new Error('認証されていません');
    }

    // Auth0のユーザー情報の存在チェック
    if (!session.user.sub) {
      throw new Error('ユーザーIDが見つかりません');
    }

    // 旅程作成制限チェック
    const existingItineraries = await getItineraries();
    if (!canCreateItinerary(session.user, existingItineraries.length)) {
      throw new Error('旅程作成制限に達しています。プレミアム会員になると無制限に作成できます。');
    }

    const now = new Date();
    const newItineraryInput: ClientItineraryInput = {
     ...data,
      startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
      dayPlans: data.dayPlans.map((day) => ({
        ...day,
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
      owner: {
        id: session.user.sub,
        name: session.user.name ?? '',
        email: session.user.email ?? '',
      },
      isPublic: false,
      sharedWith: [],
    };

    const createdItinerary = await createItinerary(newItineraryInput);

    return { success: true, id: createdItinerary.id };
  } catch (error) {
    console.error('Error: creating itinerary:', error);
    return { success: false, error: 'Failed to create itinerary' };
  }
}
