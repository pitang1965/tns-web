import { z } from 'zod';
import { itinerarySchema } from '../schemas/itinerarySchema';

// Server-side type (MongoDB document)
export type ItineraryDocument = z.infer<typeof itinerarySchema>;

// Client-side type (with string id)
export type ItineraryClient = Omit<ItineraryDocument, '_id'> & { id: string };

// Input type for creating new itineraries
export type ItineraryInput = Omit<
  ItineraryDocument,
  '_id' | 'createdAt' | 'updatedAt'
>;

// Helper function to convert ItineraryDocument to ItineraryClient
export function toItineraryClient(doc: ItineraryDocument): ItineraryClient {
  const { _id, ...rest } = doc;
  return { id: _id.toString(), ...rest };
}
