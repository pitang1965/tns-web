import { useCallback, useState, useSyncExternalStore } from 'react';
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

// クライアント描画判定用の no-op サブスクライブ（購読不要。参照を安定させる）。
const noopSubscribe = () => () => {};

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

/**
 * 「昇格＋New!」演出用のフック。
 *
 * マウント時（UpdatesReadMarker の markAllRead が走る前）に最終既読日付を
 * 一度だけスナップショットし、その値を基準に演出を駆動する。これにより
 * localStorage が既読化された後も値が変わらず、ページを離れるまで演出を保持できる。
 *
 * - hasNewSinceLastVisit: 前回より新しい更新があるか（カードの先頭昇格・見出しのNew!に使う）。
 * - isNewGroup(date): その日付グループが前回既読より新しいか（グループ見出しのNew!に使う）。
 *
 * 既読記録のない初回ユーザー（snapshot=null）は演出対象外とする
 * （ADR-0004: 初回ユーザーはナビの未読ドットのみ表示し、過剰演出はしない）。
 * ハイドレーション不一致を避けるため、マウント完了までは演出なし（false）を返す。
 */
export function useUpdatesHighlight() {
  // 初回レンダー時（=effect が走る前）に一度だけ既読日付を捕捉する。
  // useState の遅延初期化なら値が固定され、render 中の参照も正当（ref は不可）。
  const [snapshotReadDate] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : readLastReadDate(),
  );

  // サーバー/ハイドレーション初回は false、クライアント描画後に true。
  // useSyncExternalStore はこの差分をハイドレーション不一致なしに扱え、
  // useEffect 内での setState（カスケード再描画）も避けられる。
  const isClient = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  const hasNewSinceLastVisit =
    isClient &&
    latestUpdateDate !== null &&
    snapshotReadDate !== null &&
    latestUpdateDate > snapshotReadDate;

  const isNewGroup = useCallback(
    (date: string) =>
      isClient && snapshotReadDate !== null && date > snapshotReadDate,
    [isClient, snapshotReadDate],
  );

  return { hasNewSinceLastVisit, isNewGroup };
}
