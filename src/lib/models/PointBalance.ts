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
  },
  {
    timestamps: true,
  },
);

const PointBalance =
  mongoose.models.PointBalance ||
  mongoose.model<IPointBalance>('PointBalance', PointBalanceSchema);

export default PointBalance;
