'use server';

import { createItinerary } from '@/lib/itineraries';
import { ClientItineraryInput } from '@/data/schemas/itinerarySchema';
import { getSession } from '@auth0/nextjs-auth0';

export async function createItineraryAction(data: ClientItineraryInput) {
  try {
    const session = await getSession();
    if (!session?.user) {
      throw new Error('認証されていません');
    }

    // Auth0のユーザー情報の存在チェック
    if (!session.user.sub) {
      throw new Error('ユーザーIDが見つかりません');
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
      transportation: { type: 'OTHER', details: null },
      sharedWith: [],
    };

    const createdItinerary = await createItinerary(newItineraryInput);

    return { success: true, id: createdItinerary.id };
  } catch (error) {
    console.error('Error: creating itinerary:', error);
    return { success: false, error: 'Failed to create itinerary' };
  }
}
