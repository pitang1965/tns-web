import Link from 'next/link';
import { Bell, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UpdateNotesList } from '@/components/updates/UpdateNotesList';
import { UpdatesUnreadDot } from '@/components/updates/UpdatesUnreadDot';
import { UpdatesReadMarker } from '@/components/updates/UpdatesReadMarker';
import { updateNotes } from '@/data/updateNotes';

/**
 * ダッシュボード用の更新情報プレビュー。
 * 最新の日付グループのみを表示し、全件は /updates へ誘導する。
 */
export default function UpdatesCard() {
  if (updateNotes.length === 0) return null;

  return (
    <Card>
      {/* ダッシュボード表示時に最新の更新を既読にする（最新は必ずプレビュー先頭に出る） */}
      <UpdatesReadMarker />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2">
          <Bell size={20} />
          更新情報
          <UpdatesUnreadDot />
        </CardTitle>
        <Link
          href="/updates"
          className="flex items-center gap-0.5 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          すべて見る
          <ArrowRight className="size-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        <UpdateNotesList limit={2} />
      </CardContent>
    </Card>
  );
}
