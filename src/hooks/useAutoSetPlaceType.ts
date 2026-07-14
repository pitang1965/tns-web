import { useEffect, useRef } from 'react';
import type {
  FieldValues,
  SetValueConfig,
  UseFormSetValue,
} from 'react-hook-form';

type UseAutoSetPlaceTypeOptions = {
  skipAutoSet?: boolean;
};

type ToastFunction = (options: {
  title: string;
  description: string;
  duration?: number;
  variant?: 'default' | 'destructive';
}) => void;

export function useAutoSetPlaceType<TFieldValues extends FieldValues>(
  nameValue: string | undefined,
  typeValue: string | undefined,
  setValue: UseFormSetValue<TFieldValues>,
  typeFieldPath: string,
  toast: ToastFunction,
  options?: UseAutoSetPlaceTypeOptions,
) {
  const lastAutoSetTypeRef = useRef<string | null>(null);

  useEffect(() => {
    if (options?.skipAutoSet) return;
    if (!nameValue) return;
    // 'OTHER'/'ATTRACTION' はデフォルト値、lastAutoSetTypeRef と一致する場合は自動設定値として再検出を許可
    if (
      typeValue &&
      typeValue !== '' &&
      typeValue !== 'OTHER' &&
      typeValue !== 'ATTRACTION' &&
      typeValue !== lastAutoSetTypeRef.current
    )
      return;

    // フィールドパスは動的な文字列のため、文字列ベースの呼び出しに局所的に緩める
    const setFieldValue = setValue as unknown as (
      name: string,
      value: string,
      options?: SetValueConfig,
    ) => void;

    const setType = (type: string, description: string) => {
      if (lastAutoSetTypeRef.current === type) return;
      setFieldValue(typeFieldPath, type, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
      lastAutoSetTypeRef.current = type;
      toast({
        title: 'タイプを自動設定しました',
        description,
        duration: 5000,
      });
    };

    if (nameValue.includes('自宅')) {
      setType(
        'HOME',
        '「自宅」を検出したため、タイプを「自宅」に設定しました。',
      );
    } else if (nameValue.includes('RVパーク')) {
      setType(
        'PARKING_PAID_RV_PARK',
        '「RVパーク」を検出したため、タイプを「駐車場 - 有料 - RVパーク」に設定しました。',
      );
    } else if (nameValue.includes('SA') || nameValue.includes('PA')) {
      setType(
        'PARKING_FREE_SERVICE_AREA',
        '「SA」または「PA」を検出したため、タイプを「駐車場 - 無料 - SA/PA」に設定しました。',
      );
    } else if (nameValue.includes('道の駅')) {
      setType(
        'PARKING_FREE_MICHINOEKI',
        '「道の駅」を検出したため、タイプを「駐車場 - 無料 - 道の駅・◯◯の駅」に設定しました。',
      );
    } else if (
      nameValue.includes('コンビニ') ||
      nameValue.includes('スーパー')
    ) {
      setType(
        'CONVENIENCE_SUPERMARKET',
        '「コンビニ」または「スーパー」を検出したため、タイプを「コンビニ・スーパー」に設定しました。',
      );
    } else if (nameValue.includes('ガソリン') || nameValue.includes('GS')) {
      setType(
        'GAS_STATION',
        '「ガソリン」または「GS」を検出したため、タイプを「ガソリンスタンド」に設定しました。',
      );
    } else if (nameValue.includes('コインランドリー')) {
      setType(
        'COIN_LAUNDRY',
        '「コインランドリー」を検出したため、タイプを「コインランドリー」に設定しました。',
      );
    } else if (
      nameValue.includes('温泉') ||
      nameValue.includes('銭湯') ||
      nameValue.includes('入浴') ||
      nameValue.includes('風呂')
    ) {
      setType(
        'BATHING_FACILITY',
        '入浴施設のキーワードを検出したため、タイプを「入浴施設」に設定しました。',
      );
    } else if (
      nameValue.includes('ホテル') ||
      nameValue.includes('旅館') ||
      nameValue.includes('民宿')
    ) {
      setType(
        'HOTEL',
        '宿泊施設のキーワードを検出したため、タイプを「ホテル」に設定しました。',
      );
    } else if (nameValue.includes('レストラン') || nameValue.includes('食堂')) {
      setType(
        'RESTAURANT',
        '「レストラン」または「食堂」を検出したため、タイプを「レストラン」に設定しました。',
      );
    } else if (
      nameValue.includes('駐車場') ||
      nameValue.includes('パーキング')
    ) {
      setType(
        'PARKING_PAID_OTHER',
        '駐車場のキーワードを検出したため、タイプを「駐車場 - 有料 - その他」に設定しました。',
      );
    }
  }, [
    nameValue,
    typeValue,
    setValue,
    typeFieldPath,
    toast,
    options?.skipAutoSet,
  ]);
}
