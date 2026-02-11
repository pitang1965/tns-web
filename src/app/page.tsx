import type { Metadata } from 'next';
import { auth0 } from '@/lib/auth0';
import PublicHome from '@/components/common/PublicHome';
import LoggedInHome from '@/components/common/LoggedInHome';
import CampingSpot, { ICampingSpot } from '@/lib/models/CampingSpot';
import { ensureDbConnection } from '@/lib/database';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
};

async function getFeaturedSpots() {
  try {
    await ensureDbConnection();

    const spots = await CampingSpot.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .lean<ICampingSpot[]>();

    // Convert to GeoJSON features for map display
    return spots.map((spot) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: spot.coordinates, // [lng, lat]
      },
      properties: {
        _id: spot._id?.toString(),
        name: spot.name,
        prefecture: spot.prefecture,
        type: spot.type,
        address: spot.address,
        url: spot.url,
        hasRoof: spot.hasRoof,
        hasPowerOutlet: spot.hasPowerOutlet,
        isFree: spot.pricing?.isFree,
        pricePerNight: spot.pricing?.pricePerNight,
      },
    }));
  } catch (error) {
    console.error('Failed to fetch featured spots:', error);
    return [];
  }
}

export default async function Home() {
  const session = await auth0.getSession();

  if (session?.user) {
    return <LoggedInHome userName={session.user.name || 'ゲスト'} />;
  } else {
    const initialSpots = await getFeaturedSpots();
    return <PublicHome initialSpots={initialSpots} />;
  }
}
