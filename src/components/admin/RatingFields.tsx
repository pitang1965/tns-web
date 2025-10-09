'use client';
// 評価・レーティングフィールド（新システム：客観的データ入力）
import { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { ShachuHakuFormData } from './validationSchemas';

interface RatingFieldsProps {
  register: UseFormRegister<ShachuHakuFormData>;
  errors: FieldErrors<ShachuHakuFormData>;
  watch: UseFormWatch<ShachuHakuFormData>;
  spot?: any;
}

export function RatingFields({ register, errors, watch, spot }: RatingFieldsProps) {
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
      {/* セキュリティ関連 */}
      <div className='space-y-4'>
        <h3 className='text-lg font-semibold'>セキュリティ情報</h3>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='flex items-center space-x-2'>
            <input
              id='securityHasGate'
              type='checkbox'
              {...register('securityHasGate')}
            />
            <Label htmlFor='securityHasGate'>ゲート有り</Label>
            {errors.securityHasGate && (
              <p className='text-sm text-red-500'>
                {errors.securityHasGate.message}
              </p>
            )}
          </div>
          <div className='flex items-center space-x-2'>
            <input
              id='securityHasLighting'
              type='checkbox'
              {...register('securityHasLighting')}
            />
            <Label htmlFor='securityHasLighting'>照明十分</Label>
            {errors.securityHasLighting && (
              <p className='text-sm text-red-500'>
                {errors.securityHasLighting.message}
              </p>
            )}
          </div>
          <div className='flex items-center space-x-2'>
            <input
              id='securityHasStaff'
              type='checkbox'
              {...register('securityHasStaff')}
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

      {/* 夜間騒音関連 */}
      <div className='space-y-4'>
        <h3 className='text-lg font-semibold'>夜間環境情報</h3>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='flex items-center space-x-2'>
            <input
              id='nightNoiseHasNoiseIssues'
              type='checkbox'
              {...register('nightNoiseHasNoiseIssues')}
            />
            <Label htmlFor='nightNoiseHasNoiseIssues'>夜間騒音問題有り</Label>
            {errors.nightNoiseHasNoiseIssues && (
              <p className='text-sm text-red-500'>
                {errors.nightNoiseHasNoiseIssues.message}
              </p>
            )}
          </div>
          <div className='flex items-center space-x-2'>
            <input
              id='nightNoiseNearBusyRoad'
              type='checkbox'
              {...register('nightNoiseNearBusyRoad')}
            />
            <Label htmlFor='nightNoiseNearBusyRoad'>交通量多い道路近く</Label>
            {errors.nightNoiseNearBusyRoad && (
              <p className='text-sm text-red-500'>
                {errors.nightNoiseNearBusyRoad.message}
              </p>
            )}
          </div>
          <div className='flex items-center space-x-2'>
            <input
              id='nightNoiseIsQuietArea'
              type='checkbox'
              {...register('nightNoiseIsQuietArea')}
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

      {/* その他情報 */}
      <div className='space-y-4'>
        <h3 className='text-lg font-semibold'>その他情報</h3>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div>
            <div className='flex items-center justify-between mb-1'>
              <Label
                htmlFor='elevation'
                className={!spot ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ""}
              >
                標高 (m)
              </Label>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={handleCheckElevation}
                className='h-7 text-xs'
              >
                <ExternalLink className='w-3 h-3 mr-1' />
                標高を調べる
              </Button>
            </div>
            <Input
              id='elevation'
              type='number'
              min='0'
              {...register('elevation')}
              placeholder='標高（メートル）'
            />
            {errors.elevation && (
              <p className='text-sm text-red-500'>{errors.elevation.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* 計算される評価の説明 */}
      <div className='mt-6 p-4 bg-blue-50 rounded-lg'>
        <h4 className='font-semibold text-blue-800 mb-2'>自動計算される評価</h4>
        <p className='text-sm text-blue-700'>
          上記の客観的データから、治安レベルと静けさレベルが自動計算されます。
          <br />
          ・治安レベル：施設タイプ + セキュリティ設備で算出
          <br />
          ・静けさレベル：周辺環境 + 騒音要因で算出
        </p>
      </div>
    </div>
  );
}
