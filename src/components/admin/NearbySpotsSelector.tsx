'use client';

import { useState, useEffect } from 'react';
import { UseFormSetValue } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Copy, MapPin } from 'lucide-react';
import { formatDistance } from '@/lib/formatDistance';
import { ShachuHakuFormData } from './validationSchemas';
import { useToast } from '@/components/ui/use-toast';

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

type NearbySpotsSelectorProps = {
  lat: string;
  lng: string;
  setValue: UseFormSetValue<ShachuHakuFormData>;
};

const FACILITY_LABELS: Record<FacilityType, string> = {
  toilet: 'トイレ',
  convenience: 'コンビニ',
  bath: '入浴施設',
};

const FACILITY_ICONS: Record<FacilityType, string> = {
  toilet: '🚻',
  convenience: '🏪',
  bath: '♨️',
};

type ClosestFacility = {
  spotId: string;
  spotName: string;
  facilityType: FacilityType;
  distance: number;
  coordinates: [number, number];
};

export function NearbySpotsSelector({
  lat,
  lng,
  setValue,
}: NearbySpotsSelectorProps) {
  const { toast } = useToast();
  const [closestFacilities, setClosestFacilities] = useState<ClosestFacility[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNearbySpots = async () => {
      if (!lat || !lng || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
        setClosestFacilities([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/camping-spots/nearby?lat=${lat}&lng=${lng}`
        );

        if (!response.ok) {
          throw new Error('近隣スポットの取得に失敗しました');
        }

        const data: NearbySpotWithFacilities[] = await response.json();

        // 各施設タイプごとに最も近いものを抽出
        const facilityMap = new Map<FacilityType, ClosestFacility>();

        data.forEach((spot) => {
          spot.facilities.forEach((facility) => {
            const existing = facilityMap.get(facility.type);
            if (!existing || facility.distance < existing.distance) {
              facilityMap.set(facility.type, {
                spotId: spot._id,
                spotName: spot.name,
                facilityType: facility.type,
                distance: facility.distance,
                coordinates: facility.coordinates,
              });
            }
          });
        });

        // Map を配列に変換し、施設タイプの順序でソート
        const facilityOrder: FacilityType[] = ['toilet', 'convenience', 'bath'];
        const sorted = Array.from(facilityMap.values()).sort((a, b) => {
          return facilityOrder.indexOf(a.facilityType) - facilityOrder.indexOf(b.facilityType);
        });

        setClosestFacilities(sorted);
      } catch (err) {
        console.error('Error fetching nearby spots:', err);
        setError(
          err instanceof Error ? err.message : '近隣スポットの取得に失敗しました'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchNearbySpots();
  }, [lat, lng]);

  const handleCopyFacility = (facility: ClosestFacility) => {
    const [lng, lat] = facility.coordinates;

    switch (facility.facilityType) {
      case 'toilet':
        setValue('nearbyToiletLat', lat.toString());
        setValue('nearbyToiletLng', lng.toString());
        break;
      case 'convenience':
        setValue('nearbyConvenienceLat', lat.toString());
        setValue('nearbyConvenienceLng', lng.toString());
        break;
      case 'bath':
        setValue('nearbyBathLat', lat.toString());
        setValue('nearbyBathLng', lng.toString());
        break;
    }

    toast({
      title: 'コピー完了',
      description: `「${facility.spotName}」の${FACILITY_LABELS[facility.facilityType]}の座標をコピーしました`,
    });
  };

  if (!lat || !lng || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
    return (
      <div className='text-sm text-gray-500 dark:text-gray-400 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg'>
        <MapPin className='w-4 h-4 inline mr-2' />
        車中泊スポットの座標を入力すると、近隣スポットから施設情報をコピーできます
      </div>
    );
  }

  if (loading) {
    return (
      <div className='text-sm text-gray-500 dark:text-gray-400 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg'>
        近隣スポットを検索中...
      </div>
    );
  }

  if (error) {
    return (
      <div className='text-sm text-red-500 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg'>
        {error}
      </div>
    );
  }

  if (closestFacilities.length === 0) {
    return (
      <div className='text-sm text-gray-500 dark:text-gray-400 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg'>
        近隣に施設情報を持つスポットが見つかりませんでした
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      <div className='text-sm font-medium text-gray-700 dark:text-gray-300'>
        📍 最も近い施設をコピー
      </div>
      <div className='space-y-2'>
        {closestFacilities.map((facility) => (
          <div
            key={`${facility.spotId}-${facility.facilityType}`}
            className='border rounded-lg p-3 bg-white dark:bg-gray-900 dark:border-gray-700'
          >
            <div className='flex items-center justify-between'>
              <div className='flex-1'>
                <div className='text-sm font-medium mb-1'>
                  {FACILITY_ICONS[facility.facilityType]}{' '}
                  {FACILITY_LABELS[facility.facilityType]} ({formatDistance(facility.distance)})
                </div>
                <div className='text-xs text-gray-600 dark:text-gray-400'>
                  {facility.spotName}
                </div>
              </div>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => handleCopyFacility(facility)}
                className='h-8 px-3 cursor-pointer ml-3'
              >
                <Copy className='w-3 h-3 mr-1' />
                コピー
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
