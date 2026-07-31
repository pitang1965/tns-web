import { ensureDbConnection } from '@/lib/database';
import PointBalance from '@/lib/models/PointBalance';
import PointTransaction from '@/lib/models/PointTransaction';
import { logger } from '@/lib/logger';

/**
 * ポイント操作の集約（ADR-0010）。残高の読み書きはすべてここを通す。
 * 一次キーは正規化メール。呼び出し側は生の email を渡してよい（ここで正規化する）。
 *
 * 消費モデル（ADR-0010 改訂）：予約方式ではなく「生成ロック＋成功後デクリメント」。
 * - 生成ロック（acquireGenerationLock）で 1ユーザー1生成に直列化し、
 *   「残高チェック→消費までの時間差（LLMの数十秒）に並行投入して残高以上に使う」ずるを防ぐ。
 * - 消費は成功したときだけ（consumeOnSuccess）原子的に1減らす。よってタイムアウト・
 *   クラッシュで途中終了しても残高は減らない（消えない）。
 * - ロックはアズキ残高に影響しないため、解放漏れが起きても TTL 経過で自動的に奪取でき、
 *   最悪でも「一時的に生成できない」だけで済む（お金は消えない）。
 */

/** メールの正規化。ADR-0010: trim ＋ 小文字化のみ（Gmail のドット・+ 正規化はしない）。 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * 生成ロックの有効時間（ms）。生成の最大実行時間（maxDuration=300s）＋余裕。
 * これを過ぎた「立ちっぱなしのロック」は期限切れとみなし、次の生成が奪取できる。
 */
export const GENERATION_LOCK_TTL_MS = 6 * 60 * 1000; // 6分

/**
 * 残高を取得する。残高ドキュメントが無ければ null（＝一度も付与されていない）。
 * 「残高0（付与された後に使い切った）」と「未付与（null）」を区別する。
 */
export async function getBalance(email: string): Promise<number | null> {
  await ensureDbConnection();
  const doc = await PointBalance.findOne({ email: normalizeEmail(email) })
    .select('balance')
    .lean<{ balance: number } | null>();
  return doc ? doc.balance : null;
}

/**
 * 生成ロックを取得する（ADR-0010）。同一ユーザーが同時に1生成しか走らせられないようにする。
 * 「ロックが空いている（isGenerating≠true）」または「前のロックが TTL 超過（解放漏れ）」の
 * ときだけ、原子的な findOneAndUpdate で true にセットして取得する。原子CASなので同時押しでも
 * 1つしか取得できない。残高ドキュメントが無いユーザーは呼び出し側で先に弾かれる前提。
 * @returns true=取得成功 / false=他の生成が進行中（取得失敗）
 */
export async function acquireGenerationLock(email: string): Promise<boolean> {
  await ensureDbConnection();
  const now = new Date();
  const staleBefore = new Date(now.getTime() - GENERATION_LOCK_TTL_MS);
  const doc = await PointBalance.findOneAndUpdate(
    {
      email: normalizeEmail(email),
      $or: [
        { isGenerating: { $ne: true } },
        { generatingStartedAt: { $lt: staleBefore } },
      ],
    },
    { $set: { isGenerating: true, generatingStartedAt: now } },
    { new: true },
  ).lean<{ _id: unknown } | null>();
  return !!doc;
}

/** 生成ロックを解放する。正常な成功・失敗のどちらでも呼ぶ（タイムアウト時のみ漏れうる→TTLで回復）。 */
export async function releaseGenerationLock(email: string): Promise<void> {
  await ensureDbConnection();
  await PointBalance.updateOne(
    { email: normalizeEmail(email) },
    { $set: { isGenerating: false } },
  );
}

/**
 * 生成成功時に1消費する（ADR-0010）。残高が1以上あるときだけ原子的に1減らし、取引ログに
 * consume を記帳する。生成ロックで直列化しているため通常は必ず減らせるが、万一減らせなくても
 * 残高はマイナスにしない（生成結果は返す）。
 * @returns consumed=減らせたか / balance=消費後の残高
 */
export async function consumeOnSuccess(
  email: string,
  reason?: string,
): Promise<{ consumed: boolean; balance: number }> {
  await ensureDbConnection();
  const normalized = normalizeEmail(email);
  const doc = await PointBalance.findOneAndUpdate(
    { email: normalized, balance: { $gte: 1 } },
    { $inc: { balance: -1 } },
    { new: true },
  ).lean<{ balance: number } | null>();

  if (!doc) {
    // ロックがあれば通常起きない。念のためログのみ（残高は触らない）。
    logger.warn('消費時に残高が不足（ロック下では想定外）', { email: normalized });
    return { consumed: false, balance: 0 };
  }

  await PointTransaction.create({
    email: normalized,
    type: 'consume',
    amount: 1,
    reason: reason ?? '旅程ドラフト生成',
    actor: normalized,
  });

  return { consumed: true, balance: doc.balance };
}

/**
 * 付与（管理者UI）。残高ドキュメントが無ければ作成し、あれば加算（$inc）。
 * 上書き(set)ではなく加算にすることで、初期付与も補充も同じ操作で扱える。
 * 取引ログに grant を1件記帳する。
 * @returns 付与後の残高
 */
export async function grantPoints(params: {
  email: string;
  amount: number;
  reason?: string;
  actor: string;
}): Promise<{ balance: number }> {
  const { amount, reason, actor } = params;
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('付与ポイントは1以上の整数で指定してください');
  }
  await ensureDbConnection();
  const email = normalizeEmail(params.email);

  const doc = await PointBalance.findOneAndUpdate(
    { email },
    { $inc: { balance: amount }, $setOnInsert: { email } },
    { new: true, upsert: true },
  ).lean<{ balance: number } | null>();
  // upsert:true + new:true のため常にドキュメントが返るが、型の都合でガードする。
  const balance = doc?.balance ?? amount;

  await PointTransaction.create({
    email,
    type: 'grant',
    amount,
    reason: reason ?? '',
    actor: normalizeEmail(actor),
  });

  logger.info('ポイント付与', { email, amount, actor: normalizeEmail(actor) });

  return { balance };
}
