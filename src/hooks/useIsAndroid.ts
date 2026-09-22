'use client';

import { useSyncExternalStore } from 'react';
import { isAndroidDevice } from '@/lib/browserDetection';

// クライアント用の値取得
const getSnapshot = () => isAndroidDevice();

// サーバー用の値取得（常にfalse）
const getServerSnapshot = () => false;

// 変更監視用（UAは途中で変わらないため空関数）
const subscribe = () => () => {};

export function useIsAndroid(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
