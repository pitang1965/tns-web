'use client';

// 基本情報入力フィールド
import {
  UseFormRegister,
  UseFormWatch,
  UseFormSetValue,
  FieldErrors,
} from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Map } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CampingSpotWithId,
  CampingSpotTypeLabels,
  PrefectureOptions,
  CampingSpotType,
} from '@/data/schemas/campingSpot';
import { CoordinatesFromClipboardButton } from '../itinerary/CoordinatesFromClipboardButton';
import { ShachuHakuFormData } from './validationSchemas';

interface BasicInfoFieldsProps {
  spot?: CampingSpotWithId | null;
  register: UseFormRegister<ShachuHakuFormData>;
  watch: UseFormWatch<ShachuHakuFormData>;
  setValue: UseFormSetValue<ShachuHakuFormData>;
  errors: FieldErrors<ShachuHakuFormData>;
}

export function BasicInfoFields({
  spot,
  register,
  watch,
  setValue,
  errors,
}: BasicInfoFieldsProps) {
  const { toast } = useToast();

  const showOnMap = () => {
    const lat = watch('lat');
    const lng = watch('lng');

    if (!lat || !lng) {
      toast({
        title: '地図で表示',
        description: '緯度・経度を入力してください',
        variant: 'destructive',
      });
      return;
    }

    const url = `https://www.google.com/maps/place/${lat},${lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className='space-y-6'>
      {/* Basic Info */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <Label htmlFor='name'>名称 *</Label>
          <Input id='name' {...register('name')} placeholder='名称を入力' />
          {errors.name && (
            <p className='text-sm text-red-500'>{errors.name.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor='prefecture'>都道府県 *</Label>
          <Select
            onValueChange={(value) => setValue('prefecture', value)}
            defaultValue={spot?.prefecture}
          >
            <SelectTrigger>
              <SelectValue placeholder='都道府県を選択' />
            </SelectTrigger>
            <SelectContent>
              {PrefectureOptions.map((prefecture) => (
                <SelectItem key={prefecture} value={prefecture}>
                  {prefecture}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.prefecture && (
            <p className='text-sm text-red-500'>{errors.prefecture.message}</p>
          )}
        </div>
      </div>

      {/* Coordinates */}
      <div className='space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <Label htmlFor='lat'>緯度 *</Label>
            <Input id='lat' type='number' step='any' {...register('lat')} />
            {errors.lat && (
              <p className='text-sm text-red-500'>{errors.lat.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor='lng'>経度 *</Label>
            <Input id='lng' type='number' step='any' {...register('lng')} />
            {errors.lng && (
              <p className='text-sm text-red-500'>{errors.lng.message}</p>
            )}
          </div>
        </div>
        <div className='flex flex-col sm:flex-row justify-start gap-2'>
          <CoordinatesFromClipboardButton
            onCoordinatesExtracted={(latitude, longitude) => {
              setValue('lat', latitude);
              setValue('lng', longitude);
            }}
          />
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='flex items-center gap-2 text-sm h-8'
            onClick={showOnMap}
          >
            <Map className='w-4 h-4' />
            地図で表示
          </Button>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <Label htmlFor='address'>住所</Label>
          <Input
            id='address'
            {...register('address')}
            placeholder='住所（任意）'
          />
          {errors.address && (
            <p className='text-sm text-red-500'>{errors.address.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor='url'>URL</Label>
          <Input
            id='url'
            type='url'
            {...register('url')}
            placeholder='URL（任意）'
          />
          {errors.url && (
            <p className='text-sm text-red-500'>{errors.url.message}</p>
          )}
        </div>
      </div>

      {/* Type and Basic Properties */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <div>
          <Label htmlFor='type'>種別 *</Label>
          <Select
            onValueChange={(value) =>
              setValue('type', value as CampingSpotType)
            }
            defaultValue={spot?.type}
          >
            <SelectTrigger>
              <SelectValue placeholder='種別を選択' />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CampingSpotTypeLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.type && (
            <p className='text-sm text-red-500'>{errors.type.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor='capacity'>収容台数</Label>
          <Input
            id='capacity'
            type='number'
            min='1'
            placeholder='台数または空欄'
            {...register('capacity')}
          />
          {errors.capacity && (
            <p className='text-sm text-red-500'>{errors.capacity.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
