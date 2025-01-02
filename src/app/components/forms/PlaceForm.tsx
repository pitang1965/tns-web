'use client';

import { UseFormRegister, Path, useForm } from 'react-hook-form';
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
  basePath: string;
};

export function PlaceForm({
  dayIndex,
  activityIndex,
  register,
  basePath,
}: PlaceFormProps) {
  const {
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ClientItineraryInput>();

  const latitude = watch(
    `${basePath}.place.location.latitude` as Path<ClientItineraryInput>
  );
  const longitude = watch(
    `${basePath}.place.location.longitude` as Path<ClientItineraryInput>
  );

  const onSubmit = (data: ClientItineraryInput) => {
    if ((latitude && !longitude) || (!latitude && longitude)) {
      alert('緯度と経度の両方を入力するか、両方とも空欄にしてください。');
      return;
    }
    // ...existing code...
  };

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
        <Label>住所（任意）</Label>
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
            placeholder='建物名（任意）'
          />
        </div>
      </div>

      <div className='space-y-2'>
        <Label>座標（任意）</Label>
        <div className='grid grid-cols-2 gap-2'>
          <Input
            type='number'
            step='0.000001'
            {...register(
              `${basePath}.place.location.latitude` as Path<ClientItineraryInput>
            )}
            placeholder='緯度'
          />
          <Input
            type='number'
            step='0.000001'
            {...register(
              `${basePath}.place.location.longitude` as Path<ClientItineraryInput>
            )}
            placeholder='経度'
          />
        </div>
      </div>
    </div>
  );
}