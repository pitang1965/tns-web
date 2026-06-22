import Link from 'next/link';
import { Bell, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UpdateNotesList } from '@/components/updates/UpdateNotesList';
import { UpdatesNewBadge } from '@/components/updates/UpdatesNewBadge';
import { UpdatesMoreUnreadDot } from '@/components/updates/UpdatesMoreUnreadDot';
import { UpdatesReadMarker } from '@/components/updates/UpdatesReadMarker';
import { updateNotes } from '@/data/updateNotes';

/** ダッシュボードのプレビューで表示する日付グループ数 */
const PREVIEW_LIMIT = 2;

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
          {/* 既読化後もページを離れるまで残る New（マウント時スナップショット駆動） */}
          <UpdatesNewBadge />
        </CardTitle>
        <Link
          href="/updates"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          {/* プレビューに出ていない新着グループがまだある時だけ点灯 */}
          <UpdatesMoreUnreadDot limit={PREVIEW_LIMIT} />
          すべて見る
          <ArrowRight className="size-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        <UpdateNotesList limit={PREVIEW_LIMIT} />
      </CardContent>
    </Card>
  );
}
