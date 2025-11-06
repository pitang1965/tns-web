'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  contactFormSchema,
  type ContactFormData,
} from '@/data/schemas/contactSchema';

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useUser();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
  });

  // ログインユーザーの情報を自動設定
  useEffect(() => {
    if (user) {
      if (user.name) {
        setValue('name', user.name);
      }
      if (user.email) {
        setValue('email', user.email);
      }
    }
  }, [user, setValue]);

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'メール送信に失敗しました');
      }

      toast.success('お問い合わせを送信しました', {
        description:
          'お問い合わせありがとうございます。担当者より回答させていただきます。',
      });

      reset();
    } catch (error) {
      toast.error('メール送信に失敗しました', {
        description:
          error instanceof Error
            ? error.message
            : 'しばらく時間をおいて再度お試しください',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
      <div className='space-y-2'>
        <Label htmlFor='name'>
          お名前 *
          {user && (
            <span className="text-sm text-muted-foreground ml-2">
              (ログイン情報から自動入力)
            </span>
          )}
        </Label>
        <Input
          id='name'
          type='text'
          placeholder={user?.name || '山田太郎'}
          {...register('name')}
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && (
          <p className='text-sm text-red-500'>{errors.name.message}</p>
        )}
      </div>

      <div className='space-y-2'>
        <Label htmlFor='email'>
          メールアドレス *
          {user && (
            <span className="text-sm text-muted-foreground ml-2">
              (ログイン情報から自動入力)
            </span>
          )}
        </Label>
        <Input
          id='email'
          type='email'
          placeholder={user?.email || 'example@example.com'}
          {...register('email')}
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && (
          <p className='text-sm text-red-500'>{errors.email.message}</p>
        )}
      </div>

      <div className='space-y-2'>
        <Label htmlFor='subject'>件名 *</Label>
        <Input
          id='subject'
          type='text'
          placeholder='お問い合わせの件名'
          {...register('subject')}
          className={errors.subject ? 'border-red-500' : ''}
        />
        {errors.subject && (
          <p className='text-sm text-red-500'>{errors.subject.message}</p>
        )}
      </div>

      <div className='space-y-2'>
        <Label htmlFor='message'>メッセージ *</Label>
        <Textarea
          id='message'
          rows={6}
          placeholder='お問い合わせの内容をご記入ください'
          {...register('message')}
          className={errors.message ? 'border-red-500' : ''}
        />
        {errors.message && (
          <p className='text-sm text-red-500'>{errors.message.message}</p>
        )}
      </div>

      <Button type='submit' disabled={isSubmitting} className='w-full cursor-pointer'>
        {isSubmitting ? '送信中...' : 'お問い合わせを送信'}
      </Button>
    </form>
  );
}
