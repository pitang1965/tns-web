import { z } from 'zod';

export const contactFormSchema = z.object({
  name: z
    .string()
    .min(1, 'お名前を入力してください')
    .max(100, 'お名前は100文字以内で入力してください'),
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('有効なメールアドレスを入力してください')
    .max(255, 'メールアドレスは255文字以内で入力してください'),
  subject: z
    .string()
    .min(1, '件名を入力してください')
    .max(200, '件名は200文字以内で入力してください'),
  message: z
    .string()
    .min(1, 'メッセージを入力してください')
    .min(10, 'メッセージは10文字以上で入力してください')
    .max(2000, 'メッセージは2000文字以内で入力してください'),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;