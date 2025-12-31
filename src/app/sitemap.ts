import { MetadataRoute } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import { Itinerary } from '@/data/models/Itinerary';
import { CampingSpot } from '@/data/models/CampingSpot';

const BASE_URL = 'https://tabi.over40web.club';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 静的ページ
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/itineraries`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/shachu-haku`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/api/auth/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  try {
    await connectToDatabase();

    // 旅程ページの動的URL
    const itineraries = await Itinerary.find({}, { _id: 1, updatedAt: 1 })
      .sort({ updatedAt: -1 })
      .lean();

    const itineraryPages: MetadataRoute.Sitemap = itineraries.map((itinerary) => ({
      url: `${BASE_URL}/itineraries/${itinerary._id}`,
      lastModified: new Date(itinerary.updatedAt || Date.now()),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    // 車中泊スポットページの動的URL
    const campingSpots = await CampingSpot.find({}, { _id: 1, updatedAt: 1 })
      .sort({ updatedAt: -1 })
      .lean();

    const campingSpotPages: MetadataRoute.Sitemap = campingSpots.map((spot) => ({
      url: `${BASE_URL}/shachu-haku/${spot._id}`,
      lastModified: new Date(spot.updatedAt || Date.now()),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    return [...staticPages, ...itineraryPages, ...campingSpotPages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // エラー時は静的ページのみ返す
    return staticPages;
  }
}
