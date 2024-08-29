'use server';

import { createItinerary } from '@/lib/api/itineraries';
import { itinerarySchema } from '@/data/schemas/itinerarySchema';
import { v4 as uuidv4 } from 'uuid';

export async function createItineraryAction(
  title: string,
  description: string,
  startDate: string,
  endDate: string
) {
  try {
    const now = new Date();
    const newItinerary = itinerarySchema.parse({
      id: uuidv4(),
      title,
      description,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      dayPlans: [],
      // transportation フィールドを省略
      createdAt: now,
      updatedAt: now,
    });

    const createdItinerary = await createItinerary(newItinerary);

    return { success: true, id: newItinerary.id };
  } catch (error) {
    console.error('Error creating itinerary:', error);
    return { success: false, error: 'Failed to create itinerary' };
  }
}
