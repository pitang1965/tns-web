'use client';

import { useEffect } from 'react';
import { useUnreadUpdates } from '@/hooks/useUnreadUpdates';

/**
 * 更新情報ページの閲覧時に、最新の更新日付を「既読」として記録する。
 * 表示要素を持たない副作用専用コンポーネント。
 */
export function UpdatesReadMarker() {
  const { markAllRead } = useUnreadUpdates();

  useEffect(() => {
    markAllRead();
  }, [markAllRead]);

  return null;
}
