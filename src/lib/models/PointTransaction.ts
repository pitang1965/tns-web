import mongoose, { Schema, Document } from 'mongoose';

/**
 * ポイント取引ログ（ADR-0010）。ポイントは実質お金なので、収支の正本はこのコレクション。
 * PostHog は分析用でありお金の帳簿には使わない。
 *
 * 記帳の方針（ADR-0010 の「予約方式」に合わせた整合的な設計）：
 * - grant   … 付与（管理者UI）。amount は正。
 * - consume … 生成成功で確定した消費。amount は正（消費した数）。予約時点では記帳せず、
 *             生成が成功して初めて 1 件記帳する（= 成功時のみ消費）。
 * - refund  … 明示的な返還（管理者による手当て等）。amount は正。
 *
 * 予約（LLM 直前の原子デクリメント）と失敗時の払い戻しは balance の増減のみで行い、
 * ログには残さない。これにより「残高 = Σgrant − Σconsume（+Σrefund）」が成立し、
 * 実残高がこれを下回っていれば = クラッシュで払い戻しに失敗して失われたポイント、と
 * 突き合わせで検出できる（ADR-0010: 取引ログを見て管理者が手当て）。
 */
export type PointTransactionType = 'grant' | 'consume' | 'refund';

export interface IPointTransaction extends Document<string> {
  _id: string;
  email: string;
  type: PointTransactionType;
  amount: number;
  reason?: string;
  actor?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PointTransactionSchema = new Schema<IPointTransaction>(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['grant', 'consume', 'refund'],
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: String,
      trim: true,
    },
    actor: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

PointTransactionSchema.index({ email: 1, createdAt: -1 });

const PointTransaction =
  mongoose.models.PointTransaction ||
  mongoose.model<IPointTransaction>('PointTransaction', PointTransactionSchema);

export default PointTransaction;
