'use client';

import { cn } from '@/lib/utils';
import { useUpdatesHighlight } from '@/hooks/useUnreadUpdates';
import { updateNotes } from '@/data/updateNotes';

type UpdatesMoreUnreadDotProps = {
  /** プレビューに表示している日付グループ数。これ以降に未読があれば点灯する */
  limit: number;
  className?: string;
};

/**
 * ダッシュボードのプレビュー（最新 limit グループ）に出ていない新着グループが
 * まだある時だけ点灯する未読ドット。「すべて見る →」に添えて
 * 「ここに出ていない新着がまだある」ことを示す。
 */
export function UpdatesMoreUnreadDot({
  limit,
  className,
}: UpdatesMoreUnreadDotProps) {
  const { isNewGroup } = useUpdatesHighlight();

  const hasHiddenUnread = updateNotes
    .slice(limit)
    .some((entry) => isNewGroup(entry.date));

  if (!hasHiddenUnread) return null;

  return (
    <span
      role="status"
      aria-label="ほかにも新着の更新情報があります"
      className={cn(
        'inline-block size-2 shrink-0 rounded-full bg-red-500',
        className,
      )}
    />
  );
}
