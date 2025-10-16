'use server';

import { getSession } from '@auth0/nextjs-auth0';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export async function deleteItinerary(id: string) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  try {
    const client = await clientPromise;
    const db = client.db(); // 接続URIから自動取得

    const result = await db.collection('itineraries').deleteOne({
      _id: new ObjectId(id),
      'owner.id': session.user.sub,
    });

    if (result.deletedCount === 0) {
      throw new Error('Itinerary not found or not authorized to delete');
    }

    return { success: true, message: 'Itinerary deleted successfully' };
  } catch (error) {
    console.error('Error deleting itinerary:', error);
    return { success: false, message: 'Error deleting itinerary' };
  }
}
