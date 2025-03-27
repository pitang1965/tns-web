'use client';

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
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
  } = useFormContext();

  return (
    <div className='border rounded-lg p-4 space-y-4'>
      <Collapsible open={isOpen} onOpenChange={onOpenChange} className='mb-4'>
        <CollapsibleTrigger className='flex items-center justify-between w-full p-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600'>
          <h3 className='text-lg font-medium'>旅程基本情報</h3>
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
              <p className='text-red-500 text-sm mt-1'>
                {errors.title.message as string}
              </p>
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
              <p className='text-red-500 text-sm mt-1'>
                {errors.description.message as string}
              </p>
            )}
          </div>
          <div className='space-y-4 my-4'>
            <Label htmlFor='startDate'>開始日</Label>
            <Input id='startDate' type='date' {...register('startDate')} />
            {errors.startDate && (
              <p className='text-red-500 text-sm mt-1'>
                {errors.startDate.message as string}
              </p>
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
              <p className='text-red-500 text-sm mt-1'>
                {errors.numberOfDays.message as string}
              </p>
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
