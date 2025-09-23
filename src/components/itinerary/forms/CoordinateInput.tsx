'use client';

import { useState } from 'react';
import { Path, useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LocationView } from '@/components/itinerary/LocationView';
import { PlaceNavigationButton } from '@/components/itinerary/PlaceNavigationButton';
import { CoordinatesFromClipboardButton } from '@/components/itinerary/CoordinatesFromClipboardButton';
import { ClientItineraryInput } from '@/data/schemas/itinerarySchema';
import { SmallText } from '@/components/common/Typography';
import { MapPin } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import map component to avoid SSR issues
const SimpleLocationPicker = dynamic(
  () => import('@/components/common/SimpleLocationPicker'),
  {
    ssr: false,
    loading: () => (
      <div className='h-[400px] bg-gray-100 animate-pulse rounded-lg flex items-center justify-center'>
        <div className='text-gray-500'>地図を読み込み中...</div>
      </div>
    ),
  }
);

type CoordinateInputProps = {
  basePath: string;
  dayIndex: number;
  activityIndex: number;
};

export function CoordinateInput({
  basePath,
  dayIndex,
  activityIndex,
}: CoordinateInputProps) {
  const [showMap, setShowMap] = useState(false);
  const {
    register,
    setValue,
    trigger,
    watch,
    formState: { errors },
  } = useFormContext<ClientItineraryInput>();

  const latPath =
    `${basePath}.place.location.latitude` as Path<ClientItineraryInput>;
  const lonPath =
    `${basePath}.place.location.longitude` as Path<ClientItineraryInput>;

  // watchを使って値を直接参照
  const latitude = watch(latPath);
  const longitude = watch(lonPath);

  // locationオブジェクトを直接生成
  const location =
    latitude && longitude
      ? {
          latitude: Number(latitude),
          longitude: Number(longitude),
        }
      : null;

  // Handle location selection from map
  const handleLocationSelect = (lat: number, lng: number) => {
    setValue(latPath, lat);
    setValue(lonPath, lng);
    trigger([latPath, lonPath]);
  };

  return (
    <div className='space-y-2'>
      <div>
        <Label className='whitespace-nowrap block mb-2'>座標</Label>
        <div className='space-y-2'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
            <PlaceNavigationButton
              latitude={location?.latitude}
              longitude={location?.longitude}
            />
            <CoordinatesFromClipboardButton
              onCoordinatesExtracted={(lat, lng) => {
                setValue(latPath, lat);
                setValue(lonPath, lng);
                trigger([latPath, lonPath]);
              }}
            />
          </div>
          <button
            type='button'
            onClick={() => setShowMap(!showMap)}
            className='flex items-center justify-center gap-2 text-sm px-3 border bg-background hover:bg-accent hover:text-accent-foreground rounded-md h-8 text-foreground w-full'
          >
            <MapPin className='w-4 h-4' />
            {showMap ? '地図を閉じる' : '地図で選択'}
          </button>
        </div>
      </div>
      <div className='flex gap-2'>
        <div className='flex-1'>
          <Input
            type='number'
            step='any'
            placeholder='緯度'
            {...register(latPath, {
              onChange: () => trigger(lonPath), // 経度
            })}
          />
          {errors?.dayPlans?.[dayIndex]?.activities?.[activityIndex]?.place
            ?.location?.latitude && (
            <SmallText>
              {
                errors.dayPlans[dayIndex].activities[activityIndex].place
                  .location.latitude.message
              }
            </SmallText>
          )}
        </div>
        <div className='flex-1'>
          <Input
            type='number'
            step='any'
            placeholder='経度'
            {...register(lonPath, {
              onChange: () => trigger(latPath), // 緯度
            })}
          />
          {errors?.dayPlans?.[dayIndex]?.activities?.[activityIndex]?.place
            ?.location?.longitude && (
            <SmallText>
              {
                errors.dayPlans[dayIndex].activities[activityIndex].place
                  .location.longitude.message
              }
            </SmallText>
          )}
        </div>
      </div>

      {/* Map picker */}
      {showMap && (
        <div className='border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800'>
          <SimpleLocationPicker
            onLocationSelect={handleLocationSelect}
            initialLat={location?.latitude || 35.6762}
            initialLng={location?.longitude || 139.6503}
          />
        </div>
      )}

      {location && <LocationView location={location} />}
    </div>
  );
}
