import { useEffect, useRef } from 'react';

type UseAutoSetSpotTypeOptions = {
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
 * 名称から種別を自動設定するカスタムフック
 *
 * @param nameValue - 名称フィールドの値
 * @param typeValue - 種別フィールドの値
 * @param setValue - React Hook FormのsetValue関数
 * @param toast - トースト通知を表示する関数
 * @param options - オプション設定
 *
 * @example
 * ```tsx
 * const nameValue = watch('name');
 * const typeValue = watch('type');
 *
 * useAutoSetSpotType(nameValue, typeValue, setValue, toast, {
 *   skipAutoSet: !!spot // 編集モードではスキップ
 * });
 * ```
 */
export function useAutoSetSpotType(
  nameValue: string | undefined,
  typeValue: string | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: (name: any, value: any, options?: any) => void,
  toast: ToastFunction,
  options?: UseAutoSetSpotTypeOptions
) {
  const lastAutoSetTypeRef = useRef<string | null>(null);

  useEffect(() => {
    // 自動設定をスキップする場合（編集モードなど）
    if (options?.skipAutoSet) return;

    // 名称が空の場合はスキップ
    if (!nameValue) return;

    // 種別が既に設定されている場合はスキップ
    // 空文字列('')と'other'は未設定とみなす
    if (typeValue && typeValue !== '' && typeValue !== 'other') return;

    // 優先順位に従ってチェック（上から順に判定）

    // 1. コンビニ（RVパークより優先）
    if (nameValue.includes('コンビニ')) {
      if (lastAutoSetTypeRef.current === 'convenience_store') return;

      setValue('type', 'convenience_store', {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
      lastAutoSetTypeRef.current = 'convenience_store';

      toast({
        title: '種別を自動設定しました',
        description:
          '「コンビニ」を検出したため、種別を「コンビニ」に設定しました。変更が必要な場合は種別フィールドで選択し直してください。',
        duration: 5000,
      });
    }
    // 2. 道の駅
    else if (nameValue.includes('道の駅')) {
      if (lastAutoSetTypeRef.current === 'roadside_station') return;

      setValue('type', 'roadside_station', {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
      lastAutoSetTypeRef.current = 'roadside_station';

      toast({
        title: '種別を自動設定しました',
        description:
          '「道の駅」を検出したため、種別を「道の駅・〇〇の駅」に設定しました。変更が必要な場合は種別フィールドで選択し直してください。',
        duration: 5000,
      });
    }
    // 3. RVパーク
    else if (nameValue.includes('RVパーク')) {
      if (lastAutoSetTypeRef.current === 'rv_park') return;

      setValue('type', 'rv_park', {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
      lastAutoSetTypeRef.current = 'rv_park';

      toast({
        title: '種別を自動設定しました',
        description:
          '「RVパーク」を検出したため、種別を「RVパーク」に設定しました。変更が必要な場合は種別フィールドで選択し直してください。',
        duration: 5000,
      });
    }
    // 4. SA/PA
    else if (nameValue.includes('SA') || nameValue.includes('PA')) {
      if (lastAutoSetTypeRef.current === 'sa_pa') return;

      setValue('type', 'sa_pa', {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
      lastAutoSetTypeRef.current = 'sa_pa';

      toast({
        title: '種別を自動設定しました',
        description:
          '「SA」または「PA」を検出したため、種別を「SA/PA」に設定しました。変更が必要な場合は種別フィールドで選択し直してください。',
        duration: 5000,
      });
    }
    // 5. オートキャンプ
    else if (nameValue.includes('オートキャンプ')) {
      if (lastAutoSetTypeRef.current === 'auto_campground') return;

      setValue('type', 'auto_campground', {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
      lastAutoSetTypeRef.current = 'auto_campground';

      toast({
        title: '種別を自動設定しました',
        description:
          '「オートキャンプ」を検出したため、種別を「オートキャンプ場」に設定しました。変更が必要な場合は種別フィールドで選択し直してください。',
        duration: 5000,
      });
    }
    // 6. 駐車場（最後、他のルールが優先）
    else if (nameValue.includes('駐車場')) {
      if (lastAutoSetTypeRef.current === 'parking_lot') return;

      setValue('type', 'parking_lot', {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
      lastAutoSetTypeRef.current = 'parking_lot';

      toast({
        title: '種別を自動設定しました',
        description:
          '「駐車場」を検出したため、種別を「駐車場」に設定しました。変更が必要な場合は種別フィールドで選択し直してください。',
        duration: 5000,
      });
    }
    // 名称が変更されて該当しなくなった場合、リセット
    else {
      lastAutoSetTypeRef.current = null;
    }
  }, [nameValue, typeValue, setValue, toast, options?.skipAutoSet]);
}
