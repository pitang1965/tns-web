import { useEffect, useRef } from 'react';
import type {
  FieldValues,
  SetValueConfig,
  UseFormSetValue,
} from 'react-hook-form';
import {
  deriveVehicleHeight,
  hasDerivedHeightValue,
} from '@/lib/utils/parseVehicleHeight';

type UseAutoSetVehicleHeightOptions = {
  /**
   * 自動設定をスキップするかどうか（編集モード時など）
   */
  skipAutoSet?: boolean;
};

type ToastFunction = (options: {
  title: string;
  description: string;
  duration?: number;
  variant?: 'default' | 'destructive';
}) => void;

/**
 * 制限事項テキストから高さ制限（maxVehicleHeight / noHeightLimit / heightLimitCaution）を
 * 「初回のみ」自動設定するカスタムフック。
 *
 * useAutoSetPrefecture と同じ方針:
 * - 編集モード（skipAutoSet）ではスキップ
 * - 高さ項目が既に設定済みなら上書きしない（手修正を尊重）
 * - 同じテキストの再処理は ref でスキップ（無限ループ防止）
 * - 自動設定時はトーストで通知（誤検出時は各欄で修正可能）
 *
 * @param restrictionsValue - 制限事項フィールドの値
 * @param maxVehicleHeightValue - 高さ制限(cm)フィールドの値
 * @param noHeightLimitValue - 「高さ制限なし」チェックの値
 * @param heightLimitCautionValue - 「高さ要注意」チェックの値
 * @param setValue - React Hook Form の setValue
 * @param toast - トースト通知関数
 * @param options - オプション（skipAutoSet 等）
 */
export function useAutoSetVehicleHeight<TFieldValues extends FieldValues>(
  restrictionsValue: string | undefined,
  maxVehicleHeightValue: string | undefined,
  noHeightLimitValue: boolean | undefined,
  heightLimitCautionValue: boolean | undefined,
  setValue: UseFormSetValue<TFieldValues>,
  toast: ToastFunction,
  options?: UseAutoSetVehicleHeightOptions,
) {
  const lastProcessedRef = useRef<string | null>(null);

  useEffect(() => {
    // フィールド名・値の型はフォームスキーマごとに異なるため、文字列ベースの呼び出しに局所的に緩める
    const setFieldValue = setValue as unknown as (
      name: string,
      value: string | boolean,
      options?: SetValueConfig,
    ) => void;

    // 編集モードなどではスキップ
    if (options?.skipAutoSet) return;

    // 制限事項が空ならリセット
    if (!restrictionsValue || restrictionsValue.trim() === '') {
      lastProcessedRef.current = null;
      return;
    }

    // 高さ項目が既に設定済みなら上書きしない（手入力・自動設定済みを尊重）
    const alreadySet =
      (maxVehicleHeightValue != null && maxVehicleHeightValue !== '') ||
      noHeightLimitValue === true ||
      heightLimitCautionValue === true;
    if (alreadySet) return;

    // 同じテキストは再処理しない（無限ループ防止）
    if (lastProcessedRef.current === restrictionsValue) return;

    const derived = deriveVehicleHeight(restrictionsValue);
    if (!hasDerivedHeightValue(derived)) {
      // 抽出できなければ何もしない（テキスト追記で再挑戦できるよう ref は更新しない）
      return;
    }

    lastProcessedRef.current = restrictionsValue;

    const setOptions: SetValueConfig = {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    };

    const notes: string[] = [];
    if (derived.maxVehicleHeight != null) {
      setFieldValue(
        'maxVehicleHeight',
        String(derived.maxVehicleHeight),
        setOptions,
      );
      notes.push(`高さ制限 ${derived.maxVehicleHeight}cm`);
    }
    if (derived.noHeightLimit) {
      setFieldValue('noHeightLimit', true, setOptions);
      notes.push('高さ制限なし');
    }
    if (derived.heightLimitCaution) {
      setFieldValue('heightLimitCaution', true, setOptions);
      notes.push('⚠高さ要注意');
    }

    toast({
      title: '高さ制限を自動設定しました',
      description: `制限事項から「${notes.join(
        '・',
      )}」を検出しました。誤りがあれば高さ制限欄で修正してください。`,
      duration: 5000,
    });
  }, [
    restrictionsValue,
    maxVehicleHeightValue,
    noHeightLimitValue,
    heightLimitCautionValue,
    setValue,
    toast,
    options?.skipAutoSet,
  ]);
}
