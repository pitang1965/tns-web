'use client';
// 評価・レーティングフィールド
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShachuHakuFormData } from './validationSchemas';

interface RatingFieldsProps {
  register: UseFormRegister<ShachuHakuFormData>;
  errors: FieldErrors<ShachuHakuFormData>;
}

export function RatingFields({ register, errors }: RatingFieldsProps) {
  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <div>
          <Label htmlFor='quietnessLevel'>静けさレベル (1-5)</Label>
          <Input
            id='quietnessLevel'
            type='number'
            min='1'
            max='5'
            placeholder='1-5または空欄'
            {...register('quietnessLevel')}
          />
          {errors.quietnessLevel && (
            <p className='text-sm text-red-500'>
              {errors.quietnessLevel.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor='securityLevel'>治安レベル (1-5)</Label>
          <Input
            id='securityLevel'
            type='number'
            min='1'
            max='5'
            placeholder='1-5または空欄'
            {...register('securityLevel')}
          />
          {errors.securityLevel && (
            <p className='text-sm text-red-500'>
              {errors.securityLevel.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor='overallRating'>総合評価 (1-5)</Label>
          <Input
            id='overallRating'
            type='number'
            min='1'
            max='5'
            placeholder='1-5または空欄'
            {...register('overallRating')}
          />
          {errors.overallRating && (
            <p className='text-sm text-red-500'>
              {errors.overallRating.message}
            </p>
          )}
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <div>
          <Label htmlFor='elevation'>標高 (m)</Label>
          <Input
            id='elevation'
            type='number'
            min='0'
            {...register('elevation')}
            placeholder='標高(m)または空欄'
          />
          {errors.elevation && (
            <p className='text-sm text-red-500'>{errors.elevation.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}