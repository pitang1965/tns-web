import { ensureDbConnection } from '@/lib/database';
import CampingSpotSubmission from '@/lib/models/CampingSpotSubmission';
import CampingSpot from '@/lib/models/CampingSpot';
import { logger } from '@/lib/logger';

/**
 * 退会時に、スポット投稿まわりの個人データを削除・匿名化する。
 *
 * プライバシーポリシー§8 の「退会に伴い当該ユーザーに関連するデータを直ちに完全に削除」
 * の対象。スポット投稿は sub を保存せず submitterEmail / submitterName しか持たないため、
 * 名寄せはメールアドレスで行う（アズキと同じ）。
 *
 * 承認済みスポット（CampingSpot）は削除せず匿名化にとどめる:
 * 承認された時点で公開の車中泊スポット情報として他の利用者に使われており、
 * 投稿者の退会を理由に地図上の情報が消えるのは、利用者にとっても投稿者の意図にとっても
 * 望ましくない。個人データは submittedBy のメールアドレスだけなので、これを既定の
 * 'Anonymous' に置き換えれば個人との結び付きは断てる。
 *
 * 呼び出し側は email_verified が true であることを必ず確認すること。
 * 未認証のまま呼ぶと、他人のメールで登録した第三者がその人の投稿を消せてしまう。
 */
export async function deleteAllSubmissionDataForUser(email: string): Promise<{
  submissions: number;
  anonymizedSpots: number;
}> {
  await ensureDbConnection();

  const normalized = email.trim().toLowerCase();
  if (!normalized) return { submissions: 0, anonymizedSpots: 0 };

  // submitterEmail は入力時に正規化していないため、大文字小文字を無視して一致させる。
  // 完全一致のみのアンカー付きパターンなので、部分一致で他人の投稿を巻き込むことはない。
  const emailPattern = new RegExp(
    `^${normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
    'i',
  );

  const deleted = await CampingSpotSubmission.deleteMany({
    submitterEmail: emailPattern,
  });

  // 管理者として他人の投稿を審査した記録にもメールアドレスが残る（reviewedBy）。
  // 投稿そのものは他ユーザーのデータなので消さず、審査者の情報だけを取り除く。
  await CampingSpotSubmission.updateMany(
    { reviewedBy: emailPattern },
    { $unset: { reviewedBy: '' } },
  );

  const anonymized = await CampingSpot.updateMany(
    { submittedBy: emailPattern },
    { $set: { submittedBy: 'Anonymous' } },
  );

  const result = {
    submissions: deleted.deletedCount ?? 0,
    anonymizedSpots: anonymized.modifiedCount ?? 0,
  };
  // 削除処理そのものが個人データを消すための処理なので、ログにメールは残さない
  logger.info('退会に伴いスポット投稿データを削除・匿名化', result);
  return result;
}
