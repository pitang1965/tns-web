'use client';
// 価格設定フィールド

import { UseFormRegister, UseFormWatch, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ShachuHakuFormData } from './validationSchemas';

interface PricingFieldsProps {
  register: UseFormRegister<ShachuHakuFormData>;
  watch: UseFormWatch<ShachuHakuFormData>;
  setValue: UseFormSetValue<ShachuHakuFormData>;
  errors: FieldErrors<ShachuHakuFormData>;
}

export function PricingFields({ register, watch, setValue, errors }: PricingFieldsProps) {
  const isFree = watch('isFree');

  return (
    <div className='space-y-3'>
      <div>
        <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">費用</Label>
        <RadioGroup
          value={isFree || ''}
          onValueChange={(value) => setValue('isFree', value as 'free' | 'paid', { shouldValidate: true })}
          className='flex flex-row space-x-4 mt-2'
        >
          <div className='flex items-center space-x-2'>
            <RadioGroupItem value='free' id='free' />
            <label htmlFor='free' className='cursor-pointer'>無料</label>
          </div>
          <div className='flex items-center space-x-2'>
            <RadioGroupItem value='paid' id='paid' />
            <label htmlFor='paid' className='cursor-pointer'>有料</label>
          </div>
        </RadioGroup>
        {errors.isFree && (
          <p className='text-sm text-red-500 mt-1'>{errors.isFree.message}</p>
        )}
      </div>
      {isFree === 'paid' && (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <Label htmlFor='pricePerNight'>一泊料金 (円)</Label>
            <Input
              id='pricePerNight'
              type='number'
              min='0'
              {...register('pricePerNight')}
            />
          </div>
          <div>
            <Label htmlFor='priceNote'>料金備考</Label>
            <Input
              id='priceNote'
              {...register('priceNote')}
              placeholder='料金に関する備考'
            />
          </div>
        </div>
      )}
    </div>
  );
}