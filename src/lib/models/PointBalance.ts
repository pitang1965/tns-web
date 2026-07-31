import mongoose, { Schema, Document } from 'mongoose';

/**
 * ポイント残高（ADR-0010）。
 * 一次キーは正規化メール（trim＋小文字。points.ts の normalizeEmail が正規化する）。
 * Auth0 の sub ではなくメールをキーにすることで、アカウント作成前の事前付与と
 * ログイン方式（Google／メール）非依存を claim 手順なしで満たす。
 * ユーザーには「アズキ」として表示する（1ポイント = 1アズキ）。
 */
export interface IPointBalance extends Document<string> {
  _id: string;
  email: string;
  balance: number;
  /** 生成ロック（ADR-0010）。生成中は true。同一ユーザーの並行生成＝ずるを防ぐ。 */
  isGenerating?: boolean;
  /** ロック取得時刻。TTL 経過で期限切れとみなし奪取できる（解放漏れ対策）。 */
  generatingStartedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PointBalanceSchema = new Schema<IPointBalance>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    isGenerating: {
      type: Boolean,
      default: false,
    },
    generatingStartedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

const PointBalance =
  mongoose.models.PointBalance ||
  mongoose.model<IPointBalance>('PointBalance', PointBalanceSchema);

export default PointBalance;
