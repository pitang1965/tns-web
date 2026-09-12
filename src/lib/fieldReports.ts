import { ensureDbConnection } from '@/lib/database';
import FieldReport from '@/lib/models/FieldReport';

/**
 * 退会時に、そのユーザーに紐づく現地報告のデータを削除する。
 *
 * プライバシーポリシー§8・利用規約第7条が「退会に伴い、当該ユーザーに関連する
 * データを完全に削除する」と定めているため、現地報告も対象に含める。
 *
 * 消す対象は2つある:
 *   1. 本人が投稿した現地報告そのもの
 *   2. 他人の現地報告に本人が付けた通報（reporterSub は個人に紐づく識別子）
 *
 * sub を配列で受けるのは、同じ人が Google / LINE / メールで別々の Auth0 アカウントを
 * 持つため。旅程やアズキは認証済みメールで名寄せできるが、現地報告は ADR-0011 により
 * メールを保存しないので、呼び出し側で sub の一覧に解決してから渡す必要がある。
 */
export async function deleteAllFieldReportDataForUser(
  authorSubs: string[],
): Promise<number> {
  await ensureDbConnection();

  const subs = Array.from(new Set(authorSubs.filter(Boolean)));
  // 空配列で呼ぶと $in: [] になり何にも一致しない。全件削除には決してならない。
  if (subs.length === 0) return 0;

  const deleted = await FieldReport.deleteMany({ authorSub: { $in: subs } });

  await FieldReport.updateMany(
    { 'flags.reporterSub': { $in: subs } },
    { $pull: { flags: { reporterSub: { $in: subs } } } },
  );

  return deleted.deletedCount ?? 0;
}
