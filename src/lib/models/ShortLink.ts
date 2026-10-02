import mongoose, { Schema, Document } from 'mongoose';

/**
 * 管理者が発行する汎用の短縮URL。車中泊スポットに限らず、提携先なふだ
 * (nafuda.me)のURLなど任意のURLを対象とする。s.nafuda.me/<code> でアクセスすると
 * targetUrl へ転送する。
 */
export interface IShortLink extends Document {
  code: string;
  targetUrl: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const ShortLinkSchema = new Schema<IShortLink>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    targetUrl: {
      type: String,
      required: true,
      unique: true,
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const SHORT_CODE_ALPHABET =
  'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

function randomCode(length = 6): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += SHORT_CODE_ALPHABET[bytes[i] % SHORT_CODE_ALPHABET.length];
  }
  return code;
}

const ShortLink =
  mongoose.models.ShortLink ||
  mongoose.model<IShortLink>('ShortLink', ShortLinkSchema);

/** 衝突時は最大5回まで再生成する。 */
export async function generateUniqueShortCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode();
    const existing = await ShortLink.findOne({ code }).lean();
    if (!existing) return code;
  }
  throw new Error('短縮コードの生成に失敗しました');
}

export default ShortLink;
