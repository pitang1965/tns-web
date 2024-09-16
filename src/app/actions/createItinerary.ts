'use server';

import { createItinerary } from '@/lib/itineraries';
import { ItineraryInput } from '@/data/types/itinerary';

export async function createItineraryAction(
  title: string,
  description: string,
  startDate: string,
  endDate: string
) {
  try {
    const now = new Date();
    const newItineraryInput: ItineraryInput = {
      title,
      description,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      dayPlans: [],
      // transportation フィールドを省略
    };

    const createdItinerary = await createItinerary(newItineraryInput);

    return { success: true, id: createdItinerary.id };
  } catch (error) {
    console.error('Error: creating itinerary:', error);
    return { success: false, error: 'Failed to create itinerary' };
  }
}
