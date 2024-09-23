import { z } from 'zod';
import { objectIdSchema } from './commonSchemas';

export const userSchema = z.object({
  _id: objectIdSchema,
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(8), // 注: 実際にはハッシュ化されたパスワードを保存します
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const userReferenceSchema = z.object({
  _id: objectIdSchema,
  username: z.string(),
  nickname: z.string(),
});

export type User = z.infer<typeof userSchema>;
export type UserReference = z.infer<typeof userReferenceSchema>;
