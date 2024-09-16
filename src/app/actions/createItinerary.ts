'use server';

import { createItinerary } from '@/lib/itineraries';
import { itinerarySchema } from '@/data/schemas/itinerarySchema';
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

    // スキーマの検証
    itinerarySchema.parse({
      ...newItineraryInput,
      _id: undefined, // _idは自動生成されるため、ここでは未定義
      createdAt: now,
      updatedAt: now,
    });

    const createdItinerary = await createItinerary(newItineraryInput);

    return { success: true, id: createdItinerary.id };
  } catch (error) {
    console.error('Error creating itinerary:', error);
    return { success: false, error: 'Failed to create itinerary' };
  }
}
