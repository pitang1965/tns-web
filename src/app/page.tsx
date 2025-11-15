import { auth0 } from '@/lib/auth0';
import PublicHome from '@/components/common/PublicHome';
import LoggedInHome from '@/components/common/LoggedInHome';
import mongoose from 'mongoose';
import CampingSpot, { ICampingSpot } from '@/lib/models/CampingSpot';

// metadataはsrc\app\layout.tsxのものを使用する

async function ensureDbConnection() {
  if (mongoose.connection.readyState === 0) {
    const uri = process.env.MONGODB_URI!;
    await mongoose.connect(uri, {
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 10000,
    });
  }
}

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
