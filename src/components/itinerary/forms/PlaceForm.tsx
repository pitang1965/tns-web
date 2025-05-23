'use client';

import { useState } from 'react';
import { Path, useFormContext } from 'react-hook-form';
import { MapPin } from 'lucide-react';
import { LocationView } from '@/components/itinerary/LocationView';
import { PlaceNavigationButton } from '@/components/itinerary//PlaceNavigationButton';
import { CoordinatesFromClipboardButton } from '@/components/itinerary/CoordinatesFromClipboardButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ClientItineraryInput } from '@/data/schemas/itinerarySchema';
import { extractCoordinatesFromGoogleMapsUrl } from '@/lib/maps';
import { useToast } from '@/components/ui/use-toast';
import { SmallText } from '@/components/common/Typography';

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
  basePath: string;
};

export function PlaceForm({
  dayIndex,
  activityIndex,
  basePath,
}: PlaceFormProps) {
  const {
    register,
    setValue,
    trigger,
    watch,
    formState: { errors },
  } = useFormContext<ClientItineraryInput>();
  const [isAddressOpen, setIsAddressOpen] = useState(false);

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

  const { toast } = useToast();

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
          value={String(
            watch(`${basePath}.place.type` as Path<ClientItineraryInput>) || ''
          )}
          onValueChange={(value) => {
            setValue(
              `${basePath}.place.type` as Path<ClientItineraryInput>,
              value,
              {
                shouldValidate: true,
              }
            );
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
        <Collapsible open={isAddressOpen} onOpenChange={setIsAddressOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant='ghost'
              size='sm'
              className='flex items-center gap-2' // justify-between を削除
            >
              {isAddressOpen ? (
                <ChevronUp className='h-4 w-4' />
              ) : (
                <ChevronDown className='h-4 w-4' />
              )}
              <span>
                {isAddressOpen ? '入力フォームを非表示' : '入力フォームを表示'}
              </span>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
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
          </CollapsibleContent>
        </Collapsible>
      </div>

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
    </div>
  );
}
