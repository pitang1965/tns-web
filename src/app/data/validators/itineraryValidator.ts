import { serverItinerarySchema } from '@/data/schemas/itinerarySchema';
import type { ServerItineraryDocument } from '@/data/schemas/itinerarySchema';

export function validateItinerary(data: unknown): ServerItineraryDocument {
  return serverItinerarySchema.parse(data);
}
