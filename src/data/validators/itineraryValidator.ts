import { itinerarySchema } from '../schemas/itinerarySchema';
import type { Itinerary } from '../types/itinerary';

export function validateItinerary(data: unknown): Itinerary {
  return itinerarySchema.parse(data);
}
