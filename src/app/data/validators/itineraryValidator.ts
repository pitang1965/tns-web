import { itinerarySchema } from '../schemas/itinerarySchema';
import type { ItineraryDocument } from '../types/itinerary';

export function validateItinerary(data: unknown): ItineraryDocument {
  return itinerarySchema.parse(data);
}
