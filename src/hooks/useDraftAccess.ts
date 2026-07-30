'use client';

import { useState, useEffect, useCallback } from 'react';

export type DraftAccessState = {
  /** 今この瞬間に生成できるか（無制限枠 or 残高≥1）。初回スナップショット時点の値。 */
  allowed: boolean;
  /** 無制限枠（whitelist）。消費しない。 */
  unlimited: boolean;
  /** 残高（アズキ）。null = 一度も付与されていない（＝機能未開放）。無制限枠では null。 */
  balance: number | null;
  /** 不許可の理由（メール未認証／限定公開／アズキ不足）。 */
  reason: string | null;
  isLoading: boolean;
  /** 生成レスポンス等でクライアント側の残高を即時反映する（サーバ再取得なし）。 */
  setBalance: (n: number | null) => void;
  /** サーバから再取得する。 */
  refresh: () => Promise<void>;
};

type AccessPayload = {
  allowed: boolean;
  unlimited: boolean;
  balance: number | null;
  reason: string | null;
};

const ENDPOINT = '/api/itinerary-draft/access';
const FALLBACK: AccessPayload = {
  allowed: false,
  unlimited: false,
  balance: null,
  reason: null,
};

/**
 * AI旅程ドラフト生成のアクセス状態（無制限枠か／残高アズキ）をクライアントで取得する（ADR-0010）。
 * 残高は消費で変動するため、生成後は setBalance で即時反映し、必要なら refresh で再取得する。
 */
export function useDraftAccess(): DraftAccessState {
  const [state, setState] = useState<AccessPayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(ENDPOINT);
      const data: AccessPayload = res.ok ? await res.json() : FALLBACK;
      setState(data);
    } catch {
      setState(FALLBACK);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    refresh().finally(() => {
      if (!active) return;
    });
    return () => {
      active = false;
    };
  }, [refresh]);

  const setBalance = useCallback((n: number | null) => {
    setState((prev) => (prev ? { ...prev, balance: n } : prev));
  }, []);

  return {
    allowed: state?.allowed ?? false,
    unlimited: state?.unlimited ?? false,
    balance: state?.balance ?? null,
    reason: state?.reason ?? null,
    isLoading,
    setBalance,
    refresh,
  };
}
