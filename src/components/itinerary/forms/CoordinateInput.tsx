'use client';

import { Path, useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LocationView } from '@/components/itinerary/LocationView';
import { PlaceNavigationButton } from '@/components/itinerary/PlaceNavigationButton';
import { CoordinatesFromClipboardButton } from '@/components/itinerary/CoordinatesFromClipboardButton';
import { ClientItineraryInput } from '@/data/schemas/itinerarySchema';
import { SmallText } from '@/components/common/Typography';

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

  return (
    <div className='space-y-2'>
      <div>
        <Label className='whitespace-nowrap block mb-2'>座標</Label>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-2'>
          <PlaceNavigationButton
            latitude={location?.latitude}
            longitude={location?.longitude}
            className='whitespace-nowrap'
          />
          <CoordinatesFromClipboardButton
            onCoordinatesExtracted={(lat, lng) => {
              setValue(latPath, lat);
              setValue(lonPath, lng);
              trigger([latPath, lonPath]);
            }}
            className='whitespace-nowrap'
          />
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
      {location && <LocationView location={location} />}
    </div>
  );
}
