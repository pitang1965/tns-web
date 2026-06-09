'use server';

import { auth0 } from '@/lib/auth0';
import mongoose from 'mongoose';
import ItineraryModel from '@/lib/models/Itinerary';
import { ensureDbConnection } from '@/lib/database';
import { logger } from '@/lib/logger';

export async function deleteItinerary(id: string) {
  const session = await auth0.getSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return { success: false, message: 'Invalid itinerary ID' };
    }

    await ensureDbConnection();

    const result = await ItineraryModel.deleteOne({
      _id: id,
      'owner.id': session.user.sub,
    });

    if (result.deletedCount === 0) {
      throw new Error('Itinerary not found or not authorized to delete');
    }

    return { success: true, message: 'Itinerary deleted successfully' };
  } catch (error) {
    logger.error(
      error instanceof Error ? error : new Error('Error deleting itinerary'),
      { id },
    );
    return { success: false, message: 'Error deleting itinerary' };
  }
}
