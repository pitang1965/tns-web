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
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>場所の名称</Label>
          <Input
            {...register(`${basePath}.place.name` as Path<ClientItineraryInput>)}
            placeholder="場所の名前を入力"
          />
        </div>

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

      <CoordinateInput
        basePath={basePath}
        dayIndex={dayIndex}
        activityIndex={activityIndex}
      />
    </div>
  );
}
