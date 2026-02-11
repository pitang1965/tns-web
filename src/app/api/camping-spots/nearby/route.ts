import { NextResponse } from 'next/server';
import CampingSpot, { ICampingSpot } from '@/lib/models/CampingSpot';
import { ensureDbConnection } from '@/lib/database';
import { calculateDistance } from '@/lib/utils/distance';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// 施設タイプごとの検索範囲（メートル）
const SEARCH_RANGES = {
  toilet: 1000, // 1km
  convenience: 10000, // 10km
  bath: 20000, // 20km
} as const;

type FacilityType = 'toilet' | 'convenience' | 'bath';

type FacilityInfo = {
  type: FacilityType;
  distance: number;
  coordinates: [number, number];
};

type NearbySpotWithFacilities = {
  _id: string;
  name: string;
  facilities: FacilityInfo[];
};

export async function GET(request: Request) {
  try {
    await ensureDbConnection();

    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: '有効な座標を指定してください' },
        { status: 400 }
      );
    }

    // 最大検索範囲（入浴施設の20km）で取得
    const maxRange = SEARCH_RANGES.bath;

    // 概算で緯度経度の範囲を計算（1度≒111km）
    const latRange = maxRange / 111000;
    const lngRange = maxRange / (111000 * Math.cos((lat * Math.PI) / 180));

    const spots = await CampingSpot.find({
      coordinates: {
        $geoWithin: {
          $box: [
            [lng - lngRange, lat - latRange],
            [lng + lngRange, lat + latRange],
          ],
        },
      },
    }).lean<ICampingSpot[]>();

    // 各スポットについて、範囲内にある施設を抽出
    const nearbySpots: NearbySpotWithFacilities[] = [];

    for (const spot of spots) {
      const facilities: FacilityInfo[] = [];

      // トイレ
      if (spot.nearbyToiletCoordinates) {
        const distance = calculateDistance(
          lat,
          lng,
          spot.nearbyToiletCoordinates[1],
          spot.nearbyToiletCoordinates[0]
        );
        if (distance <= SEARCH_RANGES.toilet) {
          facilities.push({
            type: 'toilet',
            distance,
            coordinates: spot.nearbyToiletCoordinates,
          });
        }
      }

      // コンビニ
      if (spot.nearbyConvenienceCoordinates) {
        const distance = calculateDistance(
          lat,
          lng,
          spot.nearbyConvenienceCoordinates[1],
          spot.nearbyConvenienceCoordinates[0]
        );
        if (distance <= SEARCH_RANGES.convenience) {
          facilities.push({
            type: 'convenience',
            distance,
            coordinates: spot.nearbyConvenienceCoordinates,
          });
        }
      }

      // 入浴施設
      if (spot.nearbyBathCoordinates) {
        const distance = calculateDistance(
          lat,
          lng,
          spot.nearbyBathCoordinates[1],
          spot.nearbyBathCoordinates[0]
        );
        if (distance <= SEARCH_RANGES.bath) {
          facilities.push({
            type: 'bath',
            distance,
            coordinates: spot.nearbyBathCoordinates,
          });
        }
      }

      // 施設情報があるスポットのみ追加
      if (facilities.length > 0) {
        nearbySpots.push({
          _id: spot._id?.toString() || '',
          name: spot.name,
          facilities,
        });
      }
    }

    return NextResponse.json(nearbySpots);
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error('Error fetching nearby spots'));
    return NextResponse.json(
      { error: '近隣スポットの取得に失敗しました' },
      { status: 500 }
    );
  }
}
