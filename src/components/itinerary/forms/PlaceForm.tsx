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
import { PLACE_TYPES } from '@/constants/placeTypes';
import { CoordinateInput } from '@/components/itinerary/forms/CoordinateInput';

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

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>場所の名称</Label>
        <Input
          {...register(`${basePath}.place.name` as Path<ClientItineraryInput>)}
          placeholder="場所の名前を入力"
        />
      </div>

      <div className="space-y-2">
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
            <SelectValue placeholder="タイプを選択" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PLACE_TYPES).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {String(label)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>住所</Label>
        <Input
          {...register(`${basePath}.place.address` as Path<ClientItineraryInput>)}
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
