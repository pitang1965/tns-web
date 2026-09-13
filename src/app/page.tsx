import type { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
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

async function getSpotCount() {
  try {
    await ensureDbConnection();
    return await CampingSpot.countDocuments({});
  } catch (error) {
    console.error('Failed to count camping spots:', error);
    return 0;
  }
}

/**
 * トップページはセッションを読むため常に動的レンダリングになるが、
 * 未ログイン（ボット含む）アクセスが大半で、毎回2本のDBクエリと
 * シリアライズが走っていた（Fluid Active CPU の約4割）。
 * データキャッシュに載せて、スポットの追加・更新・削除・承認時は
 * updateTag('camping-spots') で即時反映する（campingSpots/admin.ts・
 * csv.ts・campingSpotSubmissions.ts）。表示は未ログイン向けの
 * 最新20件＋総数だけなので、24時間の revalidate は保険に過ぎない。
 */
const getCachedFeaturedSpots = unstable_cache(
  getFeaturedSpots,
  ['home-featured-spots'],
  { revalidate: 86400, tags: ['camping-spots'] },
);

const getCachedSpotCount = unstable_cache(getSpotCount, ['home-spot-count'], {
  revalidate: 86400,
  tags: ['camping-spots'],
});

export default async function Home() {
  const session = await auth0.getSession();

  if (session?.user) {
    return <LoggedInHome userName={session.user.name || 'ゲスト'} />;
  } else {
    const [initialSpots, spotCount] = await Promise.all([
      getCachedFeaturedSpots(),
      getCachedSpotCount(),
    ]);
    return <PublicHome initialSpots={initialSpots} spotCount={spotCount} />;
  }
}
