import { ensureDbConnection } from '@/lib/database';
import PointBalance from '@/lib/models/PointBalance';
import PointTransaction from '@/lib/models/PointTransaction';
import { logger } from '@/lib/logger';

/**
 * ポイント操作の集約（ADR-0010）。残高の読み書きはすべてここを通す。
 * 一次キーは正規化メール。呼び出し側は生の email を渡してよい（ここで正規化する）。
 */

/** メールの正規化。ADR-0010: trim ＋ 小文字化のみ（Gmail のドット・+ 正規化はしない）。 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

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
 * 生成直前の予約。残高が1以上あるときだけ原子的に1減らす（条件付き findOneAndUpdate）。
 * これにより同時実行の二重取り（残高1で2件成立）も原理的に防げる。
 * 予約自体は取引ログに残さない（記帳は成功確定時の consume のみ）。
 * @returns ok=true なら予約成功で balance は減算後の残高。ok=false は残高不足。
 */
export async function reservePoint(
  email: string,
): Promise<{ ok: boolean; balance: number }> {
  await ensureDbConnection();
  const doc = await PointBalance.findOneAndUpdate(
    { email: normalizeEmail(email), balance: { $gte: 1 } },
    { $inc: { balance: -1 } },
    { new: true },
  ).lean<{ balance: number } | null>();
  if (!doc) return { ok: false, balance: 0 };
  return { ok: true, balance: doc.balance };
}

/**
 * 予約した1ポイントの消費を確定する（生成成功時）。取引ログに consume を1件記帳する。
 * 残高は予約時に既に減っているため、ここでは balance を触らない。
 */
export async function commitConsume(
  email: string,
  reason?: string,
): Promise<void> {
  await ensureDbConnection();
  await PointTransaction.create({
    email: normalizeEmail(email),
    type: 'consume',
    amount: 1,
    reason: reason ?? '旅程ドラフト生成',
    actor: normalizeEmail(email),
  });
}

/**
 * 予約したが生成が失敗したときの払い戻し。原子的に1戻す。
 * 予約・払い戻しはログに残さない（net-zero）。クラッシュ等でここが呼ばれないと
 * 残高が Σgrant−Σconsume を下回り、突き合わせで失われたポイントを検出できる。
 * 払い戻し自体の失敗は握りつぶさずログのみ（生成結果の返却は妨げない）。
 */
export async function refundPoint(email: string): Promise<void> {
  await ensureDbConnection();
  await PointBalance.updateOne(
    { email: normalizeEmail(email) },
    { $inc: { balance: 1 } },
  );
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
