'use client';

import { useUpdatesHighlight } from '@/hooks/useUnreadUpdates';
import { NewLabel } from '@/components/updates/NewLabel';

type UpdatesNewBadgeProps = {
  className?: string;
};

/**
 * 更新情報カードの見出しに添える「New」ピル。
 * 前回より新しい更新があるときだけ表示し、既読化（markAllRead）後も
 * ページを離れるまで消えない（マウント時スナップショットで判定）。
 */
export function UpdatesNewBadge({ className }: UpdatesNewBadgeProps) {
  const { hasNewSinceLastVisit } = useUpdatesHighlight();

  if (!hasNewSinceLastVisit) return null;

  return <NewLabel className={className} />;
}
