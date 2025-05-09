import { z } from 'zod';
import { objectIdSchema } from './commonSchemas';

export const userSchema = z.object({
  _id: objectIdSchema,
  auth0Id: z.string(), // Auth0の'sub'フィールドに対応
  email: z.string().email(),
  name: z.string().nullable(), // Auth0のnameフィールド
  nickname: z.string().nullable(), // Auth0のnicknameフィールド
  picture: z.string().url().nullable(), // Auth0のpictureフィールド
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const userReferenceSchema = z.object({
  id: z.string(), // Auth0の'sub'フィールドに対応
  name: z.string().default(''),
  email: z.string().email(),
});

export type User = z.infer<typeof userSchema>;
export type UserReference = z.infer<typeof userReferenceSchema>;
