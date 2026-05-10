import { useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import { useWatch } from 'react-hook-form';

/**
 * react-hook-formとJotaiの状態を同期するカスタムフック
 * @param formMethods react-hook-formのuseFormから返されるメソッド
 * @param atomToSync 同期するJotaiのアトム
 * @param initialData 初期データ
 */
export function useSyncFormWithJotai(
  formMethods: any, // react-hook-formのメソッド
  atomToSync: any, // 同期するJotaiのアトム
  initialData?: any, // 初期データ（オプション）
) {
  // Jotaiの状態を取得（更新用）
  const [, setAtomValue] = useAtom(atomToSync);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // react-hook-formのwatchを使用してフォームの値の変更を監視
  const formValues = useWatch({
    control: formMethods.control,
  });

  // フォームの値からメタデータ形式に変換する関数
  const convertToMetadataFormat = (values: any) => {
    if (!values) return values;

    return {
      ...values,
      // メタデータに必要なプロパティを追加
      totalDays: values.numberOfDays,
      startDate: values.startDate,
      // dayPlansからdayPlanSummariesを生成
      dayPlanSummaries:
        values.dayPlans?.map((day: any) => ({
          date: day.date,
          notes: day.notes,
          activities: day.activities?.map((activity: any) => ({
            id: activity.id,
            title: activity.title,
          })),
        })) || [],
    };
  };

  // フォームの値が変更されたらJotaiの状態を更新 (300msデバウンス)
  useEffect(() => {
    if (formValues) {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(() => {
        const metadataValues = convertToMetadataFormat(formValues);
        setAtomValue(metadataValues);
      }, 300);
    }
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [formValues, setAtomValue]);

  // 初期データがある場合は、初回レンダリング時にJotaiの状態も初期化
  useEffect(() => {
    if (initialData) {
      // 初期データもメタデータ形式に変換
      const metadataInitialData = convertToMetadataFormat(initialData);
      setAtomValue(metadataInitialData);
    }
  }, [initialData, setAtomValue]);

  return {
    syncedValues: formValues,
  };
}
