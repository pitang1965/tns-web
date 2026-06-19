import { useCallback, useSyncExternalStore } from 'react';
import { latestUpdateDate } from '@/data/updateNotes';

const STORAGE_KEY = 'updatesLastReadDate';

// 同一ページ内の全バッジ（ナビ・タブ・メニュー・カード）が既読状態を共有し、
// markAllRead 後に即時で再描画されるよう、モジュールレベルの購読ストアにする。
const listeners = new Set<() => void>();

function readLastReadDate(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  // 別タブでの既読化も反映する
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', onStorage);
  };
}

// SSR では既読日付を取得できないため null（=未読扱い）を返す。
// useSyncExternalStore がハイドレーション後にクライアント値で再描画する。
function getServerSnapshot(): string | null {
  return null;
}

/**
 * 更新情報の未読状態（端末ごと）を管理するフック。
 * localStorage に最終既読日付（YYYY-MM-DD）を保持し、
 * 最新の更新日付がそれより新しければ未読とみなす。
 * 既読記録がない初回ユーザーは未読扱い（バッジを表示）する。
 */
export function useUnreadUpdates() {
  const lastReadDate = useSyncExternalStore(
    subscribe,
    readLastReadDate,
    getServerSnapshot,
  );

  const hasUnread =
    latestUpdateDate !== null &&
    (lastReadDate === null || latestUpdateDate > lastReadDate);

  const markAllRead = useCallback(() => {
    if (!latestUpdateDate) return;
    try {
      localStorage.setItem(STORAGE_KEY, latestUpdateDate);
    } catch {
      // localStorage 不可時は何もしない
    }
    emitChange();
  }, []);

  return { hasUnread, markAllRead };
}
