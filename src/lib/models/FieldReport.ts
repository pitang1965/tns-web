import mongoose, { Document, Schema, Types } from 'mongoose';

/**
 * 現地報告（Field Report）。
 * 実際に車中泊スポットを訪れたユーザーが、見聞きしたことを公開で書き残す記録。
 *
 * 用語の定義は CONTEXT.md、privacy 上の制約は
 * docs/adr/0011-field-report-privacy-boundaries.md を参照。
 *
 * 重要（ADR-0011）:
 *   - authorSub には Auth0 の sub のみを保存する。name / email は保存しない
 *   - authorSub と createdAt はクライアントへ渡さない。表示はハンドルと訪問年月のみ
 */

export type FieldReportFlag = {
  reporterSub: string;
  reason?: string;
  createdAt: Date;
};

export interface IFieldReport extends Document {
  spotId: Types.ObjectId;
  /** Auth0 の sub。クライアントへは決して渡さない */
  authorSub: string;
  /** 'YYYY-MM'。文字列比較がそのまま日付比較になるため並び替えキーにも使う */
  visitedYearMonth: string;
  body: string;
  /** 管理者が非表示にした報告。投稿者本人からも見えなくなる（ADR-0011） */
  isHidden: boolean;
  hiddenAt?: Date;
  flags: FieldReportFlag[];
  createdAt: Date;
  updatedAt: Date;
}

const flagSchema = new Schema<FieldReportFlag>(
  {
    reporterSub: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const fieldReportSchema = new Schema<IFieldReport>(
  {
    spotId: {
      type: Schema.Types.ObjectId,
      ref: 'CampingSpot',
      required: true,
    },
    authorSub: {
      type: String,
      required: true,
    },
    visitedYearMonth: {
      type: String,
      required: true,
      match: /^\d{4}-(0[1-9]|1[0-2])$/,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    isHidden: {
      type: Boolean,
      default: false,
    },
    hiddenAt: {
      type: Date,
    },
    flags: {
      type: [flagSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

// 同一スポット・同一訪問年月につき、1ユーザー1件（質問6の決定）。
// 削除すれば枠が空くため、編集の代わりに「削除して書き直す」が成立する。
fieldReportSchema.index(
  { spotId: 1, authorSub: 1, visitedYearMonth: 1 },
  { unique: true },
);

// 詳細ページの一覧取得: スポットで絞り、訪問年月の新しい順（同月は投稿日時の新しい順）
fieldReportSchema.index({ spotId: 1, isHidden: 1, visitedYearMonth: -1, createdAt: -1 });

// 投稿間隔の制限（rateLimit.ts はインメモリでサーバーレスでは効かないためDBで判定）
fieldReportSchema.index({ authorSub: 1, createdAt: -1 });

const FieldReport =
  mongoose.models.FieldReport ||
  mongoose.model<IFieldReport>('FieldReport', fieldReportSchema);

export default FieldReport;
