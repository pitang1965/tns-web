'use client';
// 価格設定フィールド

import { UseFormRegister, UseFormWatch, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
      <Label>費用</Label>
      <div className='flex items-center space-x-2'>
        <Checkbox
          id='isFree'
          checked={isFree}
          onCheckedChange={(checked) => setValue('isFree', !!checked)}
        />
        <label htmlFor='isFree'>無料</label>
      </div>
      {!isFree && (
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