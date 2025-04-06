'use client';

import React, { useEffect } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { H3, SmallText } from '@/components/common/Typography';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

type BasicInfoSectionProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function BasicInfoSection({
  isOpen,
  onOpenChange,
}: BasicInfoSectionProps) {
  const {
    register,
    formState: { errors },
    control,
    watch,
    setValue,
  } = useFormContext();

  // 開始日を監視
  const startDate = watch('startDate');

  // コンポーネントマウント時とstartDate値変更時に実行
  useEffect(() => {
    // ISOString形式の日付をYYYY-MM-DD形式に変換する
    if (startDate && startDate.includes('T')) {
      const dateOnly = startDate.split('T')[0];
      setValue('startDate', dateOnly);
    }
  }, [startDate, setValue]);

  return (
    <div className='border rounded-lg p-4 space-y-4'>
      <Collapsible open={isOpen} onOpenChange={onOpenChange} className='mb-4'>
        <CollapsibleTrigger className='flex items-center justify-between w-full p-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600'>
          <H3>旅程基本情報</H3>
          <span className='text-gray-500 dark:text-gray-400'>
            {isOpen ? '▲' : '▼'}
          </span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className='space-y-4 my-4'>
            <Label
              htmlFor='title'
              className="after:content-['*'] after:ml-0.5 after:text-red-500"
            >
              旅程タイトル
            </Label>
            <Input
              id='title'
              {...register('title')}
              placeholder='旅全体を簡潔に説明。例：東北グランドツーリング'
            />
            {errors.title && (
              <SmallText>{errors.title.message as string}</SmallText>
            )}
          </div>
          <div className='space-y-4 my-4'>
            <Label htmlFor='description'>説明</Label>
            <Textarea
              id='description'
              {...register('description')}
              placeholder='説明'
            />
            {errors.description && (
              <SmallText>{errors.description.message as string}</SmallText>
            )}
          </div>
          <div className='space-y-4 my-4'>
            <Label htmlFor='startDate'>開始日</Label>
            <Input
              id='startDate'
              type='date'
              {...register('startDate', {
                setValueAs: (value) => {
                  // input[type="date"]から受け取った値を処理
                  if (!value) return undefined;
                  return value; // YYYY-MM-DD形式を維持
                },
              })}
            />
            {errors.startDate && (
              <SmallText>{errors.startDate.message as string}</SmallText>
            )}
          </div>
          <div className='space-y-4 my-4'>
            <Label
              htmlFor='numberOfDays'
              className="after:content-['*'] after:ml-0.5 after:text-red-500"
            >
              日数
            </Label>
            <Input
              id='numberOfDays'
              type='number'
              min={1}
              {...register('numberOfDays', {
                valueAsNumber: true, // 文字列ではなく数値として扱う
              })}
            />
            {errors.numberOfDays && (
              <SmallText>{errors.numberOfDays.message as string}</SmallText>
            )}
          </div>
          <div className='flex items-center justify-between space-y-0 my-4'>
            <Label htmlFor='isPublic'>公開設定</Label>
            <div className='flex items-center gap-2'>
              <span className='text-sm text-gray-500'>非公開</span>
              <Controller
                name='isPublic'
                control={control}
                defaultValue={false}
                render={({ field }) => (
                  <Switch
                    id='isPublic'
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <span className='text-sm text-gray-500'>公開</span>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
