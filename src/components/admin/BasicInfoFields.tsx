'use client';

// 基本情報入力フィールド
import { useState } from 'react';
import {
  UseFormRegister,
  UseFormWatch,
  UseFormSetValue,
  FieldErrors,
} from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Map, MapPin } from 'lucide-react';
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
  const [showMap, setShowMap] = useState(false);

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

    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setValue('lat', lat.toString());
    setValue('lng', lng.toString());
  };

  return (
    <div className='space-y-6'>
      {/* Basic Info */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <Label
            htmlFor='name'
            className="after:content-['*'] after:ml-0.5 after:text-red-500"
          >
            名称
          </Label>
          <Input id='name' {...register('name')} placeholder='名称を入力' />
          {errors.name && (
            <p className='text-sm text-red-500'>{errors.name.message}</p>
          )}
        </div>
        <div>
          <Label
            htmlFor='prefecture'
            className="after:content-['*'] after:ml-0.5 after:text-red-500"
          >
            都道府県
          </Label>
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
            <Label
              htmlFor='lat'
              className="after:content-['*'] after:ml-0.5 after:text-red-500"
            >
              緯度
            </Label>
            <Input id='lat' type='number' step='any' {...register('lat')} />
            {errors.lat && (
              <p className='text-sm text-red-500'>{errors.lat.message}</p>
            )}
          </div>
          <div>
            <Label
              htmlFor='lng'
              className="after:content-['*'] after:ml-0.5 after:text-red-500"
            >
              経度
            </Label>
            <Input id='lng' type='number' step='any' {...register('lng')} />
            {errors.lng && (
              <p className='text-sm text-red-500'>{errors.lng.message}</p>
            )}
          </div>
        </div>

        <div className='space-y-4'>
          <div className='space-y-1'>
            <ButtonGroup className='w-full flex-col sm:flex-row'>
              <CoordinatesFromClipboardButton
                onCoordinatesExtracted={(latitude, longitude) => {
                  setValue('lat', latitude.toString());
                  setValue('lng', longitude.toString());
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
            <p className='text-xs text-gray-500 dark:text-gray-400'>
              Google Maps の URL
              や座標をコピーしてから「クリップボードから取得」、または地図上でクリックして位置を選択できます
            </p>
          </div>

          {showMap && (
            <div className='border-2 border-red-500 rounded-lg overflow-hidden bg-white dark:bg-gray-800'>
              {/* 注意バナー */}
              <div className='bg-yellow-100/90 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-200 px-4 py-2 text-sm font-medium text-center'>
                📍 地図をクリックして座標を選択してください
              </div>
              <SimpleLocationPicker
                onLocationSelect={handleLocationSelect}
                initialLat={watch('lat') ? Number(watch('lat')) : 35.6762}
                initialLng={watch('lng') ? Number(watch('lng')) : 139.6503}
              />
            </div>
          )}

          <div className='space-y-1'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={showOnMap}
              disabled={!watch('lat') || !watch('lng')}
              className='w-full'
            >
              <Map className='w-4 h-4' />
              地図で表示
            </Button>
            <p className='text-xs text-gray-500 dark:text-gray-400'>
              入力した座標をGoogle Mapsで確認できます
            </p>
          </div>
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
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <Label
            htmlFor='type'
            className="after:content-['*'] after:ml-0.5 after:text-red-500"
          >
            種別
          </Label>
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
      </div>

      {/* Capacity */}
      <div className='space-y-3'>
        <Label className='text-base font-semibold'>収容台数</Label>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <Label htmlFor='capacity'>普通車</Label>
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
          <div>
            <Label htmlFor='capacityLarge'>大型車</Label>
            <Input
              id='capacityLarge'
              type='number'
              min='1'
              placeholder='台数または空欄'
              {...register('capacityLarge')}
            />
            {errors.capacityLarge && (
              <p className='text-sm text-red-500'>
                {errors.capacityLarge.message}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
