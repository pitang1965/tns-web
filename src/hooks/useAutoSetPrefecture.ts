import { useEffect, useRef } from 'react';
import { PrefectureOptions } from '@/data/schemas/campingSpot';

interface UseAutoSetPrefectureOptions {
  /**
   * 自動設定をスキップするかどうか（編集モード時など）
   */
  skipAutoSet?: boolean;
}

interface ToastFunction {
  (options: {
    title: string;
    description: string;
    duration?: number;
    variant?: 'default' | 'destructive';
  }): void;
}

/**
 * 住所から都道府県を自動設定し、郵便番号を削除するカスタムフック
 *
 * @param addressValue - 住所フィールドの値
 * @param prefectureValue - 都道府県フィールドの値
 * @param setValue - React Hook FormのsetValue関数
 * @param toast - トースト通知を表示する関数
 * @param options - オプション設定
 *
 * @example
 * ```tsx
 * const addressValue = watch('address');
 * const prefectureValue = watch('prefecture');
 *
 * useAutoSetPrefecture(addressValue, prefectureValue, setValue, toast, {
 *   skipAutoSet: !!spot // 編集モードではスキップ
 * });
 * ```
 */
export function useAutoSetPrefecture(
  addressValue: string | undefined,
  prefectureValue: string | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: (name: any, value: any, options?: any) => void,
  toast: ToastFunction,
  options?: UseAutoSetPrefectureOptions
) {
  const lastProcessedAddressRef = useRef<string | null>(null);
  const hasShownPostalCodeToastRef = useRef<boolean>(false);

  useEffect(() => {
    // 自動設定をスキップする場合（編集モードなど）
    if (options?.skipAutoSet) return;

    // 住所が空の場合はスキップ
    if (!addressValue) {
      // リセット
      lastProcessedAddressRef.current = null;
      hasShownPostalCodeToastRef.current = false;
      return;
    }

    // 都道府県が既に設定されている場合はスキップ
    if (prefectureValue && prefectureValue !== '') return;

    // 既に処理済みの住所の場合はスキップ（無限ループ防止）
    if (lastProcessedAddressRef.current === addressValue) return;

    // 郵便番号パターン（〒123-4567 または 123-4567 または 1234567）
    const postalCodePattern = /^〒?\s*(\d{3}-?\d{4})\s*/;
    const postalCodeMatch = addressValue.match(postalCodePattern);

    let cleanedAddress = addressValue;
    let hasPostalCode = false;

    // 郵便番号があれば削除
    if (postalCodeMatch) {
      cleanedAddress = addressValue.replace(postalCodePattern, '').trim();
      hasPostalCode = true;
    }

    // 都道府県を検出
    let detectedPrefecture: string | null = null;
    for (const prefecture of PrefectureOptions) {
      if (cleanedAddress.startsWith(prefecture)) {
        detectedPrefecture = prefecture;
        break;
      }
    }

    // 都道府県が検出された場合
    if (detectedPrefecture) {
      lastProcessedAddressRef.current = addressValue;

      // 住所フィールドから郵便番号を削除
      if (hasPostalCode && cleanedAddress !== addressValue) {
        setValue('address', cleanedAddress, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });
      }

      // 都道府県を設定
      setValue('prefecture', detectedPrefecture, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });

      // トースト通知を表示
      toast({
        title: '都道府県を自動設定しました',
        description: `「${detectedPrefecture}」を検出したため、都道府県を「${detectedPrefecture}」に設定しました。変更が必要な場合は都道府県フィールドで選択し直してください。`,
        duration: 5000,
      });

      // 郵便番号削除のトーストは1回だけ表示
      if (hasPostalCode && !hasShownPostalCodeToastRef.current) {
        hasShownPostalCodeToastRef.current = true;
        // 少し遅延させて2つ目のトーストを表示
        setTimeout(() => {
          toast({
            title: '郵便番号を削除しました',
            description: '住所から郵便番号を自動的に削除しました。',
            duration: 3000,
          });
        }, 500);
      }
    } else {
      // 都道府県が検出されなかった場合でも、郵便番号は削除
      if (hasPostalCode && cleanedAddress !== addressValue) {
        lastProcessedAddressRef.current = addressValue;
        setValue('address', cleanedAddress, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });

        if (!hasShownPostalCodeToastRef.current) {
          hasShownPostalCodeToastRef.current = true;
          toast({
            title: '郵便番号を削除しました',
            description: '住所から郵便番号を自動的に削除しました。',
            duration: 3000,
          });
        }
      }
    }
  }, [addressValue, prefectureValue, setValue, toast, options?.skipAutoSet]);
}
