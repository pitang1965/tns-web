'use client';
// 設備・特徴フィールド
import { UseFormRegister, UseFormWatch, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ShachuHakuFormData } from './validationSchemas';

type FeatureFieldsProps = {
  register: UseFormRegister<ShachuHakuFormData>;
  watch: UseFormWatch<ShachuHakuFormData>;
  setValue: UseFormSetValue<ShachuHakuFormData>;
  errors: FieldErrors<ShachuHakuFormData>;
}

export function FeatureFields({ register, watch, setValue, errors }: FeatureFieldsProps) {
  return (
    <div className='space-y-6'>
      {/* Features */}
      <div className='space-y-3'>
        <Label>設備・特徴</Label>
        <div className='flex flex-wrap gap-4'>
          <div className='flex items-center space-x-2'>
            <Checkbox
              id='hasRoof'
              checked={watch('hasRoof')}
              onCheckedChange={(checked) =>
                setValue('hasRoof', !!checked)
              }
            />
            <label htmlFor='hasRoof'>屋根付き</label>
          </div>
          <div className='flex items-center space-x-2'>
            <Checkbox
              id='hasPowerOutlet'
              checked={watch('hasPowerOutlet')}
              onCheckedChange={(checked) =>
                setValue('hasPowerOutlet', !!checked)
              }
            />
            <label htmlFor='hasPowerOutlet'>電源あり</label>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div>
        <Label htmlFor='restrictions'>制限事項</Label>
        <Input
          id='restrictions'
          {...register('restrictions')}
          placeholder='制限事項をカンマ区切りで入力'
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
          placeholder='その他設備をカンマ区切りで入力'
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
  );
}