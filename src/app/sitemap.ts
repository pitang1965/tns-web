import { MetadataRoute } from 'next';
import CampingSpot from '@/lib/models/CampingSpot';
import { ensureDbConnection } from '@/lib/database';

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
    // 車中泊スポットページの動的URL
    await ensureDbConnection();

    const campingSpots = await CampingSpot.find({}, { _id: 1, updatedAt: 1 })
      .sort({ updatedAt: -1 })
      .lean();

    const campingSpotPages: MetadataRoute.Sitemap = campingSpots.map((spot) => ({
      url: `${BASE_URL}/shachu-haku/${spot._id}`,
      lastModified: new Date(spot.updatedAt || Date.now()),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    return [...staticPages, ...campingSpotPages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // エラー時は静的ページのみ返す
    return staticPages;
  }
}
