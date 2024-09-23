import { z } from 'zod';
import { ObjectId } from 'mongodb';

export const objectIdSchema = z.custom<ObjectId>(
  (val) => val instanceof ObjectId || ObjectId.isValid(val),
  { message: '無効なObjectIdです' }
);