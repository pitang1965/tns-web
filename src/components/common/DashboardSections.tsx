'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useUpdatesHighlight } from '@/hooks/useUnreadUpdates';

type DashboardSectionsProps = {
  quickActions: ReactNode;
  itineraryLimit: ReactNode;
  updates: ReactNode;
  recentViews: ReactNode;
};

/**
 * ダッシュボードのカード群。
 *
 * 前回より新しい更新があるときだけ、更新情報カードを先頭へ昇格させる。
 * 昇格は CSS の order のみで行い、DOM 上の位置は動かさない（要素の remount を避け、
 * markAllRead の二重実行やスナップショットの取り直しを防ぐ）。
 * 新着がない通常時は従来位置（ItineraryLimitStatus と RecentViews の間）に戻る。
 */
export function DashboardSections({
  quickActions,
  itineraryLimit,
  updates,
  recentViews,
}: DashboardSectionsProps) {
  const { hasNewSinceLastVisit } = useUpdatesHighlight();

  return (
    <div className="flex flex-col gap-6">
      {quickActions}
      {itineraryLimit}
      <div className={cn(hasNewSinceLastVisit && 'order-first')}>{updates}</div>
      {recentViews}
    </div>
  );
}
