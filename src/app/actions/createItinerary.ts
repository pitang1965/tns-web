'use server';

import { createItinerary } from '@/lib/itineraries';
import { ItineraryInput } from '@/data/types/itinerary';
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

    const now = new Date();
    const newItineraryInput: ItineraryInput = {
      title,
      description,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      dayPlans: [],
      owner: {
        id: session.user.sub,
        name: session.user.name || '',
        email: session.user.email || '',
      },
      isPublic: false,
    };

    const createdItinerary = await createItinerary(newItineraryInput);

    return { success: true, id: createdItinerary.id };
  } catch (error) {
    console.error('Error: creating itinerary:', error);
    return { success: false, error: 'Failed to create itinerary' };
  }
}
