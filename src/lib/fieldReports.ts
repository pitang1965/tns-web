import { ensureDbConnection } from '@/lib/database';
import FieldReport from '@/lib/models/FieldReport';

/**
 * 退会時に、そのユーザーに紐づく現地報告のデータを削除する。
 *
 * プライバシーポリシー§7・利用規約第7条が「退会に伴い、当該ユーザーに関連する
 * データを完全に削除する」と定めているため、現地報告も対象に含める。
 *
 * 消す対象は2つある:
 *   1. 本人が投稿した現地報告そのもの
 *   2. 他人の現地報告に本人が付けた通報（reporterSub は個人に紐づく識別子）
 */
export async function deleteAllFieldReportDataForUser(
  authorSub: string,
): Promise<number> {
  await ensureDbConnection();

  const deleted = await FieldReport.deleteMany({ authorSub });

  await FieldReport.updateMany(
    { 'flags.reporterSub': authorSub },
    { $pull: { flags: { reporterSub: authorSub } } },
  );

  return deleted.deletedCount ?? 0;
}
