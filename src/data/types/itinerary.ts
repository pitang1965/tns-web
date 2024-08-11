import { z } from 'zod';
import { itinerarySchema } from '../schemas/itinerarySchema';

export type Itinerary = z.infer<typeof itinerarySchema>;
