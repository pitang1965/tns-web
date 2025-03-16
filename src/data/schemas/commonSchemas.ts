import { z } from 'zod';

// MongoDBのObjectId用のスキーマ定義
export const objectIdSchema = z.custom<any>((val) => {
  // サーバーサイドの場合...
  if (typeof window === 'undefined') {
    try {
      const mongodb = require('mongodb');
      const mongoObjectId = mongodb.ObjectId;
      if (val instanceof mongoObjectId) return true;
      if (typeof val === 'string' && mongoObjectId.isValid(val)) return true;
      return false;
    } catch {
      // mongodbが利用できない場合は文字列チェックにフォールバック
      return typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(val);
    }
  }
  // クライアントサイドの場合
  return typeof val === 'string' || val === undefined || val === null;
});

// 他の共通スキーマもここに定義できます
