'use client';
// 近くの施設フィールド
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
import { Map, Route, Copy } from 'lucide-react';
import { CoordinatesFromClipboardButton } from '../itinerary/CoordinatesFromClipboardButton';
import { ShachuHakuFormData } from './validationSchemas';
import { NearbySpotsSelector } from './NearbySpotsSelector';

type NearbyFacilityFieldsProps = {
  register: UseFormRegister<ShachuHakuFormData>;
  watch: UseFormWatch<ShachuHakuFormData>;
  setValue: UseFormSetValue<ShachuHakuFormData>;
  errors: FieldErrors<ShachuHakuFormData>;
};

export function NearbyFacilityFields({
  register,
  watch,
  setValue,
  errors,
}: NearbyFacilityFieldsProps) {
  const { toast } = useToast();

  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  };

  const openRoute = (
    fromLat: string,
    fromLng: string,
    toLat: string,
    toLng: string
  ) => {
    if (!fromLat || !fromLng || !toLat || !toLng) {
      toast({
        title: 'エラー',
        description: '座標が設定されていません',
        variant: 'destructive',
      });
      return;
    }

    let url = `https://www.google.com/maps/dir/${fromLat},${fromLng}/${toLat},${toLng}`;
    url += '?travelmode=driving';

    if (isMobileDevice()) {
      window.location.href = url;
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className='space-y-6'>
      <div>
        <div className='flex flex-col sm:flex-row sm:items-center gap-2'>
          {watch('name') && (
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={() => {
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
                const url = `https://www.google.com/maps?q=${lat},${lng}`;
                window.open(url, '_blank');
              }}
              className='p-1 h-auto self-start sm:self-center cursor-pointer'
              title='地図で表示'
            >
              <Map className='w-4 h-4' />
            </Button>
          )}
          <Label className='text-lg font-semibold'>
            {watch('name') ? (
              <span>
                「
                <span
                  className='cursor-pointer hover:bg-yellow-200 hover:text-gray-800 px-1 rounded transition-colors inline-flex items-center gap-1'
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(watch('name'));
                      toast({
                        title: 'コピー完了',
                        description: `「${watch(
                          'name'
                        )}」をクリップボードにコピーしました`,
                      });
                    } catch (error) {
                      toast({
                        title: 'エラー',
                        description: 'クリップボードへのコピーに失敗しました',
                        variant: 'destructive',
                      });
                    }
                  }}
                  title='クリックしてコピー'
                >
                  {watch('name')}
                  <Copy className='w-3 h-3 ml-1 opacity-60' />
                </span>
                」の近くの施設の情報
              </span>
            ) : (
              '近くの施設の情報'
            )}
          </Label>
        </div>

        {/* 近隣スポットから施設をコピー */}
        <div className='mt-4'>
          <NearbySpotsSelector
            lat={watch('lat') || ''}
            lng={watch('lng') || ''}
            setValue={setValue}
          />
        </div>

        <div className='space-y-6 mt-4'>
          {/* トイレ情報 */}
          <div className='border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-600'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-3'>
              <Label className='text-md font-medium'>トイレ</Label>
              <div className='flex flex-col sm:flex-row gap-2'>
                <Button
                  type='button'
                  variant='secondary'
                  size='sm'
                  onClick={() => {
                    setValue('distanceToToilet', '0');
                    setValue('nearbyToiletLat', '');
                    setValue('nearbyToiletLng', '');
                    toast({
                      title: '設定完了',
                      description: 'トイレを「敷地内にあるが場所不明」に設定しました',
                    });
                  }}
                  className='cursor-pointer'
                >
                  敷地内にあるが場所不明
                </Button>
                <CoordinatesFromClipboardButton
                  onCoordinatesExtracted={(lat, lng) => {
                    setValue('nearbyToiletLat', lat.toString());
                    setValue('nearbyToiletLng', lng.toString());
                  }}
                />
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    const lat = watch('nearbyToiletLat');
                    const lng = watch('nearbyToiletLng');
                    if (!lat || !lng) {
                      toast({
                        title: '地図で表示',
                        description: 'トイレの緯度・経度を入力してください',
                        variant: 'destructive',
                      });
                      return;
                    }
                    const url = `https://www.google.com/maps?q=${lat},${lng}`;
                    window.open(url, '_blank');
                  }}
                  className='flex items-center gap-1 cursor-pointer'
                >
                  <Map className='w-4 h-4' />
                  地図で表示
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    openRoute(
                      watch('lat') || '',
                      watch('lng') || '',
                      watch('nearbyToiletLat') || '',
                      watch('nearbyToiletLng') || ''
                    );
                  }}
                  className='flex items-center gap-1 cursor-pointer'
                >
                  <Route className='w-4 h-4' />
                  ルート検索
                </Button>
              </div>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-3'>
              <div>
                <Label htmlFor='distanceToToilet'>距離 (m)</Label>
                <Input
                  id='distanceToToilet'
                  type='number'
                  min='0'
                  placeholder='距離(m)または空欄'
                  {...register('distanceToToilet')}
                />
                {errors.distanceToToilet && (
                  <p className='text-sm text-red-500'>
                    {errors.distanceToToilet.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor='nearbyToiletLat'>緯度</Label>
                <Input
                  id='nearbyToiletLat'
                  type='number'
                  step='any'
                  placeholder='緯度（任意）'
                  {...register('nearbyToiletLat')}
                />
                {errors.nearbyToiletLat && (
                  <p className='text-sm text-red-500'>
                    {errors.nearbyToiletLat.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor='nearbyToiletLng'>経度</Label>
                <Input
                  id='nearbyToiletLng'
                  type='number'
                  step='any'
                  placeholder='経度（任意）'
                  {...register('nearbyToiletLng')}
                />
                {errors.nearbyToiletLng && (
                  <p className='text-sm text-red-500'>
                    {errors.nearbyToiletLng.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* コンビニ情報 */}
          <div className='border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-600'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-3'>
              <Label className='text-md font-medium'>コンビニ</Label>
              <div className='flex flex-col sm:flex-row gap-2'>
                <CoordinatesFromClipboardButton
                  onCoordinatesExtracted={(lat, lng) => {
                    setValue('nearbyConvenienceLat', lat.toString());
                    setValue('nearbyConvenienceLng', lng.toString());
                  }}
                />
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    const lat = watch('nearbyConvenienceLat');
                    const lng = watch('nearbyConvenienceLng');
                    if (!lat || !lng) {
                      toast({
                        title: '地図で表示',
                        description: 'コンビニの緯度・経度を入力してください',
                        variant: 'destructive',
                      });
                      return;
                    }
                    const url = `https://www.google.com/maps?q=${lat},${lng}`;
                    window.open(url, '_blank');
                  }}
                  className='flex items-center gap-1 cursor-pointer'
                >
                  <Map className='w-4 h-4' />
                  地図で表示
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    openRoute(
                      watch('lat') || '',
                      watch('lng') || '',
                      watch('nearbyConvenienceLat') || '',
                      watch('nearbyConvenienceLng') || ''
                    );
                  }}
                  className='flex items-center gap-1 cursor-pointer'
                >
                  <Route className='w-4 h-4' />
                  ルート検索
                </Button>
              </div>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-3'>
              <div>
                <Label htmlFor='distanceToConvenience'>距離 (m)</Label>
                <Input
                  id='distanceToConvenience'
                  type='number'
                  min='0'
                  {...register('distanceToConvenience')}
                  placeholder='距離(m)または空欄'
                />
                {errors.distanceToConvenience && (
                  <p className='text-sm text-red-500'>
                    {errors.distanceToConvenience.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor='nearbyConvenienceLat'>緯度</Label>
                <Input
                  id='nearbyConvenienceLat'
                  type='number'
                  step='any'
                  placeholder='緯度（任意）'
                  {...register('nearbyConvenienceLat')}
                />
                {errors.nearbyConvenienceLat && (
                  <p className='text-sm text-red-500'>
                    {errors.nearbyConvenienceLat.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor='nearbyConvenienceLng'>経度</Label>
                <Input
                  id='nearbyConvenienceLng'
                  type='number'
                  step='any'
                  placeholder='経度（任意）'
                  {...register('nearbyConvenienceLng')}
                />
                {errors.nearbyConvenienceLng && (
                  <p className='text-sm text-red-500'>
                    {errors.nearbyConvenienceLng.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 入浴施設情報 */}
          <div className='border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-600'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-3'>
              <Label className='text-md font-medium'>入浴施設</Label>
              <div className='flex flex-col sm:flex-row gap-2'>
                <Button
                  type='button'
                  variant='secondary'
                  size='sm'
                  onClick={() => {
                    setValue('distanceToBath', '0');
                    setValue('nearbyBathLat', '');
                    setValue('nearbyBathLng', '');
                    toast({
                      title: '設定完了',
                      description: '入浴施設を「敷地内にあるが場所不明」に設定しました',
                    });
                  }}
                  className='cursor-pointer'
                >
                  敷地内にあるが場所不明
                </Button>
                <CoordinatesFromClipboardButton
                  onCoordinatesExtracted={(lat, lng) => {
                    setValue('nearbyBathLat', lat.toString());
                    setValue('nearbyBathLng', lng.toString());
                  }}
                />
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    const lat = watch('nearbyBathLat');
                    const lng = watch('nearbyBathLng');
                    if (!lat || !lng) {
                      toast({
                        title: '地図で表示',
                        description: '入浴施設の緯度・経度を入力してください',
                        variant: 'destructive',
                      });
                      return;
                    }
                    const url = `https://www.google.com/maps?q=${lat},${lng}`;
                    window.open(url, '_blank');
                  }}
                  className='flex items-center gap-1 cursor-pointer'
                >
                  <Map className='w-4 h-4' />
                  地図で表示
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    openRoute(
                      watch('lat') || '',
                      watch('lng') || '',
                      watch('nearbyBathLat') || '',
                      watch('nearbyBathLng') || ''
                    );
                  }}
                  className='flex items-center gap-1 cursor-pointer'
                >
                  <Route className='w-4 h-4' />
                  ルート検索
                </Button>
              </div>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-3'>
              <div>
                <Label htmlFor='distanceToBath'>距離 (m)</Label>
                <Input
                  id='distanceToBath'
                  type='number'
                  min='0'
                  {...register('distanceToBath')}
                  placeholder='距離(m)または空欄'
                />
                {errors.distanceToBath && (
                  <p className='text-sm text-red-500'>
                    {errors.distanceToBath.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor='nearbyBathLat'>緯度</Label>
                <Input
                  id='nearbyBathLat'
                  type='number'
                  step='any'
                  placeholder='緯度（任意）'
                  {...register('nearbyBathLat')}
                />
                {errors.nearbyBathLat && (
                  <p className='text-sm text-red-500'>
                    {errors.nearbyBathLat.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor='nearbyBathLng'>経度</Label>
                <Input
                  id='nearbyBathLng'
                  type='number'
                  step='any'
                  placeholder='経度（任意）'
                  {...register('nearbyBathLng')}
                />
                {errors.nearbyBathLng && (
                  <p className='text-sm text-red-500'>
                    {errors.nearbyBathLng.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
