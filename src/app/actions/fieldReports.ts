'use server';

import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';
import type { User } from '@auth0/nextjs-auth0/types';
import { auth0 } from '@/lib/auth0';
import { ensureDbConnection } from '@/lib/database';
import { logger } from '@/lib/logger';
import { getCreatorHandle } from '@/lib/creatorHandle';
import { isAdmin } from '@/lib/userUtils';
import resend from '@/lib/resend';
import CampingSpot from '@/lib/models/CampingSpot';
import FieldReport, { IFieldReport } from '@/lib/models/FieldReport';
import {
  FIELD_REPORT_DAILY_LIMIT,
  fieldReportFlagSchema,
  fieldReportInputSchema,
  type AdminFieldReport,
  type AdminFieldReportFilter,
  type FieldReportActionResult,
  type FieldReportInput,
  type PublicFieldReport,
} from '@/data/schemas/fieldReport';

/**
 * 現地報告のサーバーアクション。
 *
 * ADR-0011 の制約をここで守る:
 *   - authorSub と createdAt をクライアントへ渡さない（toPublicFieldReport が唯一の出口）
 *   - 非表示にされた報告は投稿者本人からも見えない（管理者のみ確認できる）
 */

const DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;

const DUPLICATE_ERROR_MESSAGE =
  'この訪問年月の報告は既に投稿されています。書き直す場合は、先に既存の報告を削除してください';

async function getSessionUser(): Promise<User | null> {
  const session = await auth0.getSession();
  return session?.user ?? null;
}

/**
 * 投稿・通報の前提条件（質問6の決定）。
 * ログイン必須 かつ email_verified 必須。既存の checkDraftAccess と同じ考え方だが、
 * こちらはポイント残高を要求しない。
 */
function checkPostingEligibility(
  user: User | null,
): { allowed: true; sub: string } | { allowed: false; error: string } {
  if (!user?.sub) {
    return { allowed: false, error: 'ログインしてください' };
  }
  if (!user.email_verified) {
    return {
      allowed: false,
      error:
        'メールアドレスの認証を完了してください。認証後に投稿できるようになります',
    };
  }
  return { allowed: true, sub: user.sub };
}

/** クライアントへ渡す形へ変換する唯一の出口（ADR-0011） */
function toPublicFieldReport(
  report: IFieldReport,
  viewerSub: string | null,
  viewerIsAdmin: boolean,
): PublicFieldReport {
  const base: PublicFieldReport = {
    id: String(report._id),
    visitedYearMonth: report.visitedYearMonth,
    body: report.body,
    handle: getCreatorHandle(report.authorSub),
    isOwn: viewerSub !== null && report.authorSub === viewerSub,
    isFlagged:
      viewerSub !== null &&
      report.flags.some((flag) => flag.reporterSub === viewerSub),
  };

  if (viewerIsAdmin) {
    base.isHidden = report.isHidden;
    base.flagCount = report.flags.length;
  }

  return base;
}

/**
 * スポットの現地報告を取得する。
 * 並び順は訪問年月の新しい順、同月なら投稿日時の新しい順（投稿日時は表示しない）。
 */
export async function getFieldReportsBySpot(
  spotId: string,
): Promise<PublicFieldReport[]> {
  if (!mongoose.Types.ObjectId.isValid(spotId)) return [];

  await ensureDbConnection();

  const user = await getSessionUser();
  const viewerSub = user?.sub ?? null;
  const viewerIsAdmin = isAdmin(user);

  // 一般ユーザーには非表示の報告を一切返さない。管理者だけが非表示分も見て、
  // 誤判定を戻せる（ADR-0011 決定8）。
  const query: Record<string, unknown> = { spotId };
  if (!viewerIsAdmin) {
    query.isHidden = { $ne: true };
  }

  const reports = await FieldReport.find(query)
    .sort({ visitedYearMonth: -1, createdAt: -1 })
    .lean<IFieldReport[]>();

  return reports.map((report) =>
    toPublicFieldReport(report, viewerSub, viewerIsAdmin),
  );
}

/** 現地報告を投稿する */
export async function createFieldReport(
  input: FieldReportInput,
): Promise<FieldReportActionResult> {
  const user = await getSessionUser();
  const eligibility = checkPostingEligibility(user);
  if (!eligibility.allowed) {
    return { success: false, error: eligibility.error };
  }

  const parsed = fieldReportInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? '入力内容に不備があります',
    };
  }

  const { spotId, visitedYearMonth, body } = parsed.data;

  if (!mongoose.Types.ObjectId.isValid(spotId)) {
    return { success: false, error: 'スポットが見つかりません' };
  }

  try {
    await ensureDbConnection();

    const spotExists = await CampingSpot.exists({ _id: spotId });
    if (!spotExists) {
      return { success: false, error: 'スポットが見つかりません' };
    }

    // 投稿間隔の制限。rateLimit.ts はインメモリでインスタンスごとに独立するため、
    // サーバーレス環境では素通りする。DBの投稿記録で判定する（質問6の決定）。
    const recentCount = await FieldReport.countDocuments({
      authorSub: eligibility.sub,
      createdAt: { $gte: new Date(Date.now() - DAILY_WINDOW_MS) },
    });
    if (recentCount >= FIELD_REPORT_DAILY_LIMIT) {
      return {
        success: false,
        error: `1日に投稿できる報告は${FIELD_REPORT_DAILY_LIMIT}件までです。時間をおいてお試しください`,
      };
    }

    // 同一スポット・同一訪問年月に1件の制約を、アプリ側でも確かめる。
    //
    // ユニーク索引だけに頼ってはいけない: 本番は
    // database.ts で `autoIndex: process.env.NODE_ENV !== 'production'` としており、
    // 索引は自動作成されない（scripts/sync-field-report-indexes.cjs で手動作成）。
    // 索引未作成の環境でも制約が効くよう、ここで先に見る。
    // 競合時の最終的な担保は引き続きユニーク索引（下の 11000 ハンドリング）。
    const duplicate = await FieldReport.exists({
      spotId,
      authorSub: eligibility.sub,
      visitedYearMonth,
    });
    if (duplicate) {
      return { success: false, error: DUPLICATE_ERROR_MESSAGE };
    }

    await FieldReport.create({
      spotId,
      authorSub: eligibility.sub,
      visitedYearMonth,
      body,
    });

    revalidatePath(`/shachu-haku/${spotId}`);
    return { success: true };
  } catch (error) {
    // 同一スポット・同一訪問年月に1件のユニーク制約
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    ) {
      return { success: false, error: DUPLICATE_ERROR_MESSAGE };
    }

    logger.error(
      error instanceof Error
        ? error
        : new Error('現地報告の投稿に失敗しました'),
    );
    return { success: false, error: '投稿に失敗しました' };
  }
}

/**
 * 自分の現地報告を削除する。
 * 編集機能は持たない（削除して書き直す）。削除は本人が身元露出を取り消す唯一の手段。
 */
export async function deleteFieldReport(
  reportId: string,
): Promise<FieldReportActionResult> {
  const user = await getSessionUser();
  if (!user?.sub) {
    return { success: false, error: 'ログインしてください' };
  }
  if (!mongoose.Types.ObjectId.isValid(reportId)) {
    return { success: false, error: '報告が見つかりません' };
  }

  try {
    await ensureDbConnection();

    const report = await FieldReport.findOneAndDelete({
      _id: reportId,
      authorSub: user.sub,
    }).lean<IFieldReport | null>();

    if (!report) {
      return { success: false, error: '報告が見つかりません' };
    }

    revalidatePath(`/shachu-haku/${String(report.spotId)}`);
    return { success: true };
  } catch (error) {
    logger.error(
      error instanceof Error
        ? error
        : new Error('現地報告の削除に失敗しました'),
    );
    return { success: false, error: '削除に失敗しました' };
  }
}

/**
 * 現地報告を通報する。
 * 自動非表示の閾値は設けない（組織的通報で正当な報告を消せる穴を作らないため）。
 * 管理者にメールで通知し、人力で判断する（質問11の決定）。
 */
export async function flagFieldReport(input: {
  reportId: string;
  reason?: string;
}): Promise<FieldReportActionResult> {
  const user = await getSessionUser();
  const eligibility = checkPostingEligibility(user);
  if (!eligibility.allowed) {
    return { success: false, error: eligibility.error };
  }

  const parsed = fieldReportFlagSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? '入力内容に不備があります',
    };
  }

  const { reportId, reason } = parsed.data;
  if (!mongoose.Types.ObjectId.isValid(reportId)) {
    return { success: false, error: '報告が見つかりません' };
  }

  try {
    await ensureDbConnection();

    // 1ユーザーにつき1報告1通報まで（通報自体のスパム防止）。
    // $ne で既存の通報者を弾くため、二重通報でも件数は増えない。
    const updated = await FieldReport.findOneAndUpdate(
      { _id: reportId, 'flags.reporterSub': { $ne: eligibility.sub } },
      {
        $push: {
          flags: {
            reporterSub: eligibility.sub,
            reason,
            createdAt: new Date(),
          },
        },
      },
      { new: true },
    ).lean<IFieldReport | null>();

    if (!updated) {
      // 存在しないか、既に通報済み。どちらも利用者から見れば「受付済み」で十分
      return { success: true };
    }

    await notifyAdminOfFlag(updated, reason);

    revalidatePath(`/shachu-haku/${String(updated.spotId)}`);
    return { success: true };
  } catch (error) {
    logger.error(
      error instanceof Error
        ? error
        : new Error('現地報告の通報に失敗しました'),
    );
    return { success: false, error: '通報に失敗しました' };
  }
}

async function notifyAdminOfFlag(
  report: IFieldReport,
  reason: string | undefined,
): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    logger.warn('[現地報告] ADMIN_EMAIL 未設定のため通報を通知できません');
    return;
  }

  const spot = await CampingSpot.findById(report.spotId)
    .select('name')
    .lean<{ name?: string } | null>();

  // 通知が失敗しても通報自体は成立させる（記録はDBに残っている）
  const result = await resend.sendFieldReportFlag({
    adminEmail,
    spotId: String(report.spotId),
    spotName: spot?.name ?? '(不明なスポット)',
    reportId: String(report._id),
    visitedYearMonth: report.visitedYearMonth,
    body: report.body,
    flagCount: report.flags.length,
    reason,
  });

  if (!result.success) {
    logger.error(new Error(`[現地報告] 通報通知の送信に失敗: ${result.error}`));
  }
}

/** 管理画面向けの変換（ADR-0011 の例外として createdAt を含む） */
function toAdminFieldReport(
  report: IFieldReport,
  spotName?: string,
): AdminFieldReport {
  return {
    id: String(report._id),
    spotId: String(report.spotId),
    spotName,
    visitedYearMonth: report.visitedYearMonth,
    body: report.body,
    handle: getCreatorHandle(report.authorSub),
    isHidden: !!report.isHidden,
    flagCount: report.flags.length,
    flagReasons: report.flags
      .map((flag) => flag.reason)
      .filter((reason): reason is string => !!reason),
    createdAt: new Date(report.createdAt).toISOString(),
  };
}

/**
 * スポット編集画面用。そのスポットの現地報告を、非表示分も含めて返す。
 * 管理者はこれを読んで掲載データを見直す（機能の中心のループ）。
 */
export async function getSpotFieldReportsForAdmin(
  spotId: string,
): Promise<AdminFieldReport[]> {
  const user = await getSessionUser();
  if (!isAdmin(user)) return [];
  if (!mongoose.Types.ObjectId.isValid(spotId)) return [];

  await ensureDbConnection();

  const reports = await FieldReport.find({ spotId })
    .sort({ visitedYearMonth: -1, createdAt: -1 })
    .lean<IFieldReport[]>();

  return reports.map((report) => toAdminFieldReport(report));
}

/**
 * 現地報告管理画面用。スポットをまたいで一覧する。
 *
 *   flagged: 通報のある報告（通報件数の多い順）
 *   hidden : 非表示中の報告。誤判定を戻すための入口
 *   all    : すべて（訪問年月の新しい順）
 */
export async function listFieldReportsForAdmin(
  filter: AdminFieldReportFilter,
  limit = 200,
): Promise<AdminFieldReport[]> {
  const user = await getSessionUser();
  if (!isAdmin(user)) return [];

  await ensureDbConnection();

  const query: Record<string, unknown> = {};
  let sort: Record<string, 1 | -1> = { visitedYearMonth: -1, createdAt: -1 };

  if (filter === 'flagged') {
    query['flags.0'] = { $exists: true };
    sort = { createdAt: -1 };
  } else if (filter === 'hidden') {
    query.isHidden = true;
    sort = { hiddenAt: -1 };
  }

  const reports = await FieldReport.find(query)
    .sort(sort)
    .limit(limit)
    .lean<IFieldReport[]>();

  // 通報件数順はDBでソートしにくいため、件数を絞った上でメモリで並べ替える
  if (filter === 'flagged') {
    reports.sort((a, b) => b.flags.length - a.flags.length);
  }

  // スポット名はまとめて引く（$lookup を使わずに2クエリで済ませる）
  const spotIds = [...new Set(reports.map((report) => String(report.spotId)))];
  const spots = await CampingSpot.find({ _id: { $in: spotIds } })
    .select('name')
    .lean<{ _id: unknown; name: string }[]>();
  const nameById = new Map(
    spots.map((spot) => [String(spot._id), spot.name]),
  );

  return reports.map((report) =>
    toAdminFieldReport(report, nameById.get(String(report.spotId))),
  );
}

/**
 * 現地報告の表示・非表示を切り替える（管理者のみ）。
 * 物理削除ではないため、誤判定を戻せる。
 */
export async function setFieldReportHidden(
  reportId: string,
  hidden: boolean,
): Promise<FieldReportActionResult> {
  const user = await getSessionUser();
  if (!isAdmin(user)) {
    return { success: false, error: '権限がありません' };
  }
  if (!mongoose.Types.ObjectId.isValid(reportId)) {
    return { success: false, error: '報告が見つかりません' };
  }

  try {
    await ensureDbConnection();

    const updated = await FieldReport.findByIdAndUpdate(
      reportId,
      hidden
        ? { isHidden: true, hiddenAt: new Date() }
        : { isHidden: false, $unset: { hiddenAt: 1 } },
      { new: true },
    ).lean<IFieldReport | null>();

    if (!updated) {
      return { success: false, error: '報告が見つかりません' };
    }

    revalidatePath(`/shachu-haku/${String(updated.spotId)}`);
    return { success: true };
  } catch (error) {
    logger.error(
      error instanceof Error
        ? error
        : new Error('現地報告の表示切替に失敗しました'),
    );
    return { success: false, error: '操作に失敗しました' };
  }
}
