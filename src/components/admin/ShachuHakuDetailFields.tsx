'use client';
// 車中泊スポット詳細フィールド（設備・特徴、標高、セキュリティ、夜間環境、その他）
import { UseFormRegister, UseFormWatch, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { ShachuHakuFormData } from './validationSchemas';

type ShachuHakuDetailFieldsProps = {
  register: UseFormRegister<ShachuHakuFormData>;
  watch: UseFormWatch<ShachuHakuFormData>;
  setValue: UseFormSetValue<ShachuHakuFormData>;
  errors: FieldErrors<ShachuHakuFormData>;
  spot?: any;
}

export function ShachuHakuDetailFields({
  register,
  watch,
  setValue,
  errors,
  spot
}: ShachuHakuDetailFieldsProps) {
  const handleCheckElevation = () => {
    const lat = watch('lat');
    const lng = watch('lng');

    if (lat && lng) {
      const url = `https://maps.gsi.go.jp/#18/${lat}/${lng}/`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className='space-y-6'>
      {/* セキュリティ情報 */}
      <div className='space-y-4'>
        <h3 className='text-lg font-semibold'>セキュリティ情報</h3>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='flex items-center space-x-2'>
            <Checkbox
              id='securityHasGate'
              checked={watch('securityHasGate')}
              onCheckedChange={(checked) =>
                setValue('securityHasGate', !!checked)
              }
            />
            <Label htmlFor='securityHasGate'>ゲート有り</Label>
            {errors.securityHasGate && (
              <p className='text-sm text-red-500'>
                {errors.securityHasGate.message}
              </p>
            )}
          </div>
          <div className='flex items-center space-x-2'>
            <Checkbox
              id='securityHasLighting'
              checked={watch('securityHasLighting')}
              onCheckedChange={(checked) =>
                setValue('securityHasLighting', !!checked)
              }
            />
            <Label htmlFor='securityHasLighting'>照明十分</Label>
            {errors.securityHasLighting && (
              <p className='text-sm text-red-500'>
                {errors.securityHasLighting.message}
              </p>
            )}
          </div>
          <div className='flex items-center space-x-2'>
            <Checkbox
              id='securityHasStaff'
              checked={watch('securityHasStaff')}
              onCheckedChange={(checked) =>
                setValue('securityHasStaff', !!checked)
              }
            />
            <Label htmlFor='securityHasStaff'>管理人・職員有り</Label>
            {errors.securityHasStaff && (
              <p className='text-sm text-red-500'>
                {errors.securityHasStaff.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 夜間環境情報 */}
      <div className='space-y-4'>
        <h3 className='text-lg font-semibold'>夜間環境情報</h3>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='flex items-center space-x-2'>
            <Checkbox
              id='nightNoiseHasNoiseIssues'
              checked={watch('nightNoiseHasNoiseIssues')}
              onCheckedChange={(checked) =>
                setValue('nightNoiseHasNoiseIssues', !!checked)
              }
            />
            <Label htmlFor='nightNoiseHasNoiseIssues'>夜間騒音問題有り</Label>
            {errors.nightNoiseHasNoiseIssues && (
              <p className='text-sm text-red-500'>
                {errors.nightNoiseHasNoiseIssues.message}
              </p>
            )}
          </div>
          <div className='flex items-center space-x-2'>
            <Checkbox
              id='nightNoiseNearBusyRoad'
              checked={watch('nightNoiseNearBusyRoad')}
              onCheckedChange={(checked) =>
                setValue('nightNoiseNearBusyRoad', !!checked)
              }
            />
            <Label htmlFor='nightNoiseNearBusyRoad'>交通量多い道路近く</Label>
            {errors.nightNoiseNearBusyRoad && (
              <p className='text-sm text-red-500'>
                {errors.nightNoiseNearBusyRoad.message}
              </p>
            )}
          </div>
          <div className='flex items-center space-x-2'>
            <Checkbox
              id='nightNoiseIsQuietArea'
              checked={watch('nightNoiseIsQuietArea')}
              onCheckedChange={(checked) =>
                setValue('nightNoiseIsQuietArea', !!checked)
              }
            />
            <Label htmlFor='nightNoiseIsQuietArea'>静かなエリア</Label>
            {errors.nightNoiseIsQuietArea && (
              <p className='text-sm text-red-500'>
                {errors.nightNoiseIsQuietArea.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 設備・特徴 */}
      <div className='space-y-4'>
        <h3 className='text-lg font-semibold'>設備・特徴</h3>
        <div className='flex flex-wrap gap-4'>
          <div className='flex items-center space-x-2'>
            <Checkbox
              id='hasRoof'
              checked={watch('hasRoof')}
              onCheckedChange={(checked) =>
                setValue('hasRoof', !!checked)
              }
            />
            <Label htmlFor='hasRoof'>屋根付き</Label>
          </div>
          <div className='flex items-center space-x-2'>
            <Checkbox
              id='hasPowerOutlet'
              checked={watch('hasPowerOutlet')}
              onCheckedChange={(checked) =>
                setValue('hasPowerOutlet', !!checked)
              }
            />
            <Label htmlFor='hasPowerOutlet'>電源あり</Label>
          </div>
        </div>

        {/* 収容台数 */}
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

      {/* その他情報 */}
      <div className='space-y-4'>
        <h3 className='text-lg font-semibold'>その他情報</h3>

        {/* 標高 */}
        <div>
          <div className='flex items-center justify-between mb-1'>
            <Label
              htmlFor='elevation'
              className="after:content-['*'] after:ml-0.5 after:text-red-500"
            >
              標高 (m)
            </Label>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={handleCheckElevation}
              className='h-7 text-xs cursor-pointer'
            >
              <ExternalLink className='w-3 h-3 mr-1' />
              標高を調べる
            </Button>
          </div>
          <Input
            id='elevation'
            type='number'
            min='-10'
            max='3776'
            {...register('elevation')}
            placeholder='標高（メートル）'
          />
          {errors.elevation && (
            <p className='text-sm text-red-500'>{errors.elevation.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor='restrictions'>制限事項</Label>
          <Input
            id='restrictions'
            {...register('restrictions')}
            placeholder='全高や利用時間等の制限事項を入力'
          />
          {errors.restrictions && (
            <p className='text-sm text-red-500'>{errors.restrictions.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor='amenities'>その他設備</Label>
          <Input
            id='amenities'
            {...register('amenities')}
            placeholder='その他の設備を入力'
          />
          {errors.amenities && (
            <p className='text-sm text-red-500'>{errors.amenities.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor='notes'>備考</Label>
          <Textarea
            id='notes'
            {...register('notes')}
            placeholder='詳細な情報、アクセス方法、注意点など（任意）'
            rows={4}
          />
          {errors.notes && (
            <p className='text-sm text-red-500'>{errors.notes.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
