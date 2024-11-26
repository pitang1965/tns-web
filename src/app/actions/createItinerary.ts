'use server';

import { createItinerary } from '@/lib/itineraries';
import { ClientItineraryInput } from '@/data/schemas/itinerarySchema';
import { getSession } from '@auth0/nextjs-auth0';

export async function createItineraryAction(
  title: string,
  description: string,
  startDate: string,
  endDate: string
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

    const now = new Date();
    const newItineraryInput: ClientItineraryInput = {
      title,
      description,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      dayPlans: [],
      owner: {
        id: session.user.sub,
        name: session.user.name ?? '',
        email: session.user.email ?? '',
      },
      isPublic: false,
      transportation: { type: 'OTHER' },
      sharedWith: [],
    };

    const createdItinerary = await createItinerary(newItineraryInput);

    return { success: true, id: createdItinerary.id };
  } catch (error) {
    console.error('Error: creating itinerary:', error);
    return { success: false, error: 'Failed to create itinerary' };
  }
}
