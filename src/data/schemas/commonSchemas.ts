import { z } from 'zod';

// 以下をクライアントのコードで利用できない
// import { ObjectId } from 'mongodb';

// export const objectIdSchema = z.custom<ObjectId>(
//   (val) => val instanceof ObjectId || ObjectId.isValid(val),
//   { message: '無効なObjectIdです' }
// );

export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/);
