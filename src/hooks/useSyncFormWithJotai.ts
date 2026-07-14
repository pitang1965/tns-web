import { useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import type { PrimitiveAtom } from 'jotai';
import { useWatch } from 'react-hook-form';
import type { FieldValues, UseFormReturn } from 'react-hook-form';
import type { ItineraryMetadata } from '@/data/store/itineraryAtoms';

/**
 * メタデータ変換で参照するフォーム値の構造型
 * （フォームスキーマ全体には依存せず、必要なプロパティのみを定義）
 */
type SyncedFormValues = {
  numberOfDays?: number | null;
  startDate?: string | null;
  dayPlans?:
    | {
        date?: string | null;
        notes?: string | null;
        activities?: { id?: string | null; title?: string | null }[] | null;
      }[]
    | null;
} & Record<string, unknown>;

/**
 * react-hook-formとJotaiの状態を同期するカスタムフック
 * @param formMethods react-hook-formのuseFormから返されるメソッド
 * @param atomToSync 同期するJotaiのアトム
 * @param initialData 初期データ
 */
export function useSyncFormWithJotai<TFieldValues extends FieldValues>(
  formMethods: UseFormReturn<TFieldValues>,
  atomToSync: PrimitiveAtom<ItineraryMetadata>,
  initialData?: unknown,
) {
  // Jotaiの状態を取得（更新用）
  const [, setAtomValue] = useAtom(atomToSync);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // react-hook-formのwatchを使用してフォームの値の変更を監視
  const formValues = useWatch({
    control: formMethods.control,
  });

  // フォームの値からメタデータ形式に変換する関数
  const convertToMetadataFormat = (values: SyncedFormValues) => {
    if (!values) return values;

    return {
      ...values,
      // メタデータに必要なプロパティを追加
      totalDays: values.numberOfDays,
      startDate: values.startDate,
      // dayPlansからdayPlanSummariesを生成
      dayPlanSummaries:
        values.dayPlans?.map((day) => ({
          date: day.date,
          notes: day.notes,
          activities: day.activities?.map((activity) => ({
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
        const metadataValues = convertToMetadataFormat(
          formValues as SyncedFormValues,
        );
        setAtomValue(metadataValues as ItineraryMetadata);
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
      const metadataInitialData = convertToMetadataFormat(
        initialData as SyncedFormValues,
      );
      setAtomValue(metadataInitialData as ItineraryMetadata);
    }
  }, [initialData, setAtomValue]);

  return {
    syncedValues: formValues,
  };
}
