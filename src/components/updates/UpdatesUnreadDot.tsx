'use client';

import { cn } from '@/lib/utils';
import { useUnreadUpdates } from '@/hooks/useUnreadUpdates';

type UpdatesUnreadDotProps = {
  className?: string;
};

/**
 * 未読の更新情報があるときだけ表示する赤いドット。
 * メニュー項目やダッシュボードカードの見出しに添えて使う。
 */
export function UpdatesUnreadDot({ className }: UpdatesUnreadDotProps) {
  const { hasUnread } = useUnreadUpdates();

  if (!hasUnread) return null;

  return (
    <span
      role="status"
      aria-label="新着の更新情報があります"
      className={cn(
        'inline-block size-2 shrink-0 rounded-full bg-red-500',
        className,
      )}
    />
  );
}
