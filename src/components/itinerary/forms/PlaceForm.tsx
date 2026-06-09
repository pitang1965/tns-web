'use client';

import { Path, useFormContext } from 'react-hook-form';
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
import { PLACE_TYPES, PlaceType } from '@/constants/placeTypes';
import { CoordinateInput } from '@/components/itinerary/forms/CoordinateInput';
import { useAutoSetPlaceType } from '@/hooks/useAutoSetPlaceType';
import { useToast } from '@/components/ui/use-toast';
import { PlaceNameAutocomplete } from '@/components/itinerary/forms/PlaceNameAutocomplete';
import { SmallText } from '@/components/common/Typography';

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
  const { register, setValue, watch } = useFormContext<ClientItineraryInput>();
  const { toast } = useToast();

  const nameValue = watch(
    `${basePath}.place.name` as Path<ClientItineraryInput>,
  ) as string | undefined;
  const selectedType = watch(
    `${basePath}.place.type` as Path<ClientItineraryInput>,
  ) as PlaceType | undefined;
  const isHomeType = selectedType === 'HOME';

  useAutoSetPlaceType(
    nameValue,
    selectedType,
    setValue,
    `${basePath}.place.type`,
    toast,
  );

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>場所（検索）</Label>
        <PlaceNameAutocomplete
          value={nameValue ?? ''}
          onChange={(val) =>
            setValue(
              `${basePath}.place.name` as Path<ClientItineraryInput>,
              val,
            )
          }
          onPlaceSelect={({ name, address, latitude, longitude }) => {
            setValue(
              `${basePath}.place.name` as Path<ClientItineraryInput>,
              name,
            );
            setValue(
              `${basePath}.place.address` as Path<ClientItineraryInput>,
              address,
            );
            setValue(
              `${basePath}.place.location.latitude` as Path<ClientItineraryInput>,
              latitude,
            );
            setValue(
              `${basePath}.place.location.longitude` as Path<ClientItineraryInput>,
              longitude,
            );
          }}
        />
        <SmallText className="text-muted-foreground">
          駐車場・観光地・施設など、車を停める・立ち寄る具体的な場所
        </SmallText>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Label>場所のタイプ</Label>
            {isHomeType && (
              <span className="text-xs text-muted-foreground">
                自宅の座標・住所は非公開
              </span>
            )}
          </div>
          <Select
            value={String(
              watch(`${basePath}.place.type` as Path<ClientItineraryInput>) || '',
            )}
            onValueChange={(value) => {
              setValue(
                `${basePath}.place.type` as Path<ClientItineraryInput>,
                value,
                {
                  shouldValidate: true,
                },
              );
            }}
          >
            <SelectTrigger className="cursor-pointer">
              <SelectValue placeholder="タイプを選択" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PLACE_TYPES).map(([value, label]) => (
                <SelectItem key={value} value={value} className="cursor-pointer">
                  {String(label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>住所</Label>
          <Input
            {...register(
              `${basePath}.place.address` as Path<ClientItineraryInput>,
            )}
            placeholder="例: 東京都渋谷区恵比寿南1-2-3"
          />
        </div>
      </div>

      <CoordinateInput
        basePath={basePath}
        dayIndex={dayIndex}
        activityIndex={activityIndex}
      />
    </div>
  );
}
