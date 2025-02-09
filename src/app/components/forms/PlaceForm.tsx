'use client';

import {
  UseFormRegister,
  UseFormTrigger,
  Path,
  FieldErrors,
} from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ClientItineraryInput } from '@/data/schemas/itinerarySchema';

const PLACE_TYPES = {
  HOME: '自宅',
  ATTRACTION: '観光地',
  RESTAURANT: 'レストラン',
  HOTEL: 'ホテル',
  PARKING_PAID_RV_PARK: '駐車場 - 有料 - RVパーク',
  PARKING_PAID_OTHER: '駐車場 - 有料 - その他',
  PARKING_FREE_SERVICE_AREA: '駐車場 - 無料 - SA/PA',
  PARKING_FREE_MICHINOEKI: '駐車場 - 無料 - 道の駅',
  PARKING_FREE_OTHER: '駐車場 - 無料 - その他',
  GAS_STATION: 'ガソリンスタンド',
  CONVENIENCE_SUPERMARKET: 'コンビニ・スーパー',
  BATHING_FACILITY: '入浴施設',
  COIN_LAUNDRY: 'コインランドリー',
  OTHER: 'その他',
} as const;

type PlaceFormProps = {
  dayIndex: number;
  activityIndex: number;
  register: UseFormRegister<ClientItineraryInput>;
  trigger: UseFormTrigger<ClientItineraryInput>;
  basePath: string;
  errors: FieldErrors<ClientItineraryInput>;
};

export function PlaceForm({
  dayIndex,
  activityIndex,
  register,
  trigger,
  basePath,
  errors,
}: PlaceFormProps) {
  const latPath =
    `${basePath}.place.location.latitude` as Path<ClientItineraryInput>;
  const lonPath =
    `${basePath}.place.location.longitude` as Path<ClientItineraryInput>;

  return (
    <div className='space-y-4'>
      <div className='space-y-2'>
        <Label>場所の名称</Label>
        <Input
          {...register(`${basePath}.place.name` as Path<ClientItineraryInput>)}
          placeholder='場所の名前を入力'
        />
      </div>

      <div className='space-y-2'>
        <Label>場所のタイプ</Label>
        <Select
          onValueChange={(value) => {
            register(
              `${basePath}.place.type` as Path<ClientItineraryInput>
            ).onChange({
              target: { value },
            });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder='タイプを選択' />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PLACE_TYPES).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className='space-y-2'>
        <Label>住所</Label>
        <div className='grid grid-cols-2 gap-2'>
          <Input
            {...register(
              `${basePath}.place.address.postalCode` as Path<ClientItineraryInput>
            )}
            placeholder='郵便番号'
          />
          <Input
            {...register(
              `${basePath}.place.address.prefecture` as Path<ClientItineraryInput>
            )}
            placeholder='都道府県'
          />
          <Input
            {...register(
              `${basePath}.place.address.city` as Path<ClientItineraryInput>
            )}
            placeholder='市区町村'
          />
          <Input
            {...register(
              `${basePath}.place.address.town` as Path<ClientItineraryInput>
            )}
            placeholder='町名'
          />
          <Input
            {...register(
              `${basePath}.place.address.block` as Path<ClientItineraryInput>
            )}
            placeholder='番地'
          />
          <Input
            {...register(
              `${basePath}.place.address.building` as Path<ClientItineraryInput>
            )}
            placeholder='建物名'
          />
        </div>
      </div>

      <div className='space-y-2'>
        <Label>座標</Label>
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
              <p className='text-red-500 text-sm mt-1'>
                {
                  errors.dayPlans[dayIndex].activities[activityIndex].place
                    .location.latitude.message
                }
              </p>
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
              <p className='text-red-500 text-sm mt-1'>
                {
                  errors.dayPlans[dayIndex].activities[activityIndex].place
                    .location.longitude.message
                }
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
