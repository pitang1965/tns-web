'use client';

import { useState } from 'react';
import { Path, useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { LocationView } from '@/components/itinerary/LocationView';
import { PlaceNavigationButton } from '@/components/itinerary/PlaceNavigationButton';
import { CoordinatesFromClipboardButton } from '@/components/itinerary/CoordinatesFromClipboardButton';
import { ClientItineraryInput } from '@/data/schemas/itinerarySchema';
import { SmallText } from '@/components/common/Typography';
import { MapPin } from 'lucide-react';
import dynamic from 'next/dynamic';
import { LoadingState } from '@/components/common/LoadingState';

// Dynamically import map component to avoid SSR issues
const SimpleLocationPicker = dynamic(
  () => import('@/components/common/SimpleLocationPicker'),
  {
    ssr: false,
    loading: () => <LoadingState variant='card' message='地図を読み込み中...' />,
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
        <div className='flex gap-2'>
          <div className='flex-1'>
            <Input
              type='number'
              step='any'
              placeholder='緯度'
              {...register(latPath, {
                setValueAs: (v) => (v === '' ? undefined : parseFloat(v)),
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
                setValueAs: (v) => (v === '' ? undefined : parseFloat(v)),
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
        <div className='space-y-2 mt-2'>
          <ButtonGroup className='w-full flex-col sm:flex-row'>
            <CoordinatesFromClipboardButton
              onCoordinatesExtracted={(lat, lng) => {
                // 明示的に数値に変換
                setValue(latPath, Number(lat), { shouldValidate: true });
                setValue(lonPath, Number(lng), { shouldValidate: true });
                trigger([latPath, lonPath]);
              }}
              className='flex-1'
            />
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => setShowMap(!showMap)}
              className='flex-1'
            >
              <MapPin className='w-4 h-4' />
              {showMap ? '選択完了' : '地図で選択'}
            </Button>
          </ButtonGroup>
          {/* Map picker */}
          {showMap && (
            <div className='border-2 border-red-500 rounded-lg overflow-hidden bg-white dark:bg-gray-800'>
              {/* 注意バナー */}
              <div className='bg-yellow-100/90 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-200 px-4 py-2 text-sm font-medium text-center'>
                📍 地図をクリックして座標を選択してください
              </div>
              <SimpleLocationPicker
                onLocationSelect={handleLocationSelect}
                initialLat={location?.latitude || 35.6762}
                initialLng={location?.longitude || 139.6503}
              />
            </div>
          )}
          <PlaceNavigationButton
            latitude={location?.latitude}
            longitude={location?.longitude}
          />
        </div>
      </div>
      {location && !showMap && <LocationView location={location} />}
    </div>
  );
}
