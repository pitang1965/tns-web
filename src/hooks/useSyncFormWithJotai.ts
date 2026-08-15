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
  // 初期データによるatom初期化を一度だけに限定するためのフラグ
  const didInitRef = useRef(false);
  // getValuesは安定参照。実データの取得元として使う（下記コメント参照）
  const { getValues } = formMethods;

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
        // useWatchは「変更検知のトリガー」としてのみ使い、実データはgetValues()を正とする。
        // 編集画面はDayPaginationで現在の日だけをマウントするため、前日/翌日への移動は
        // 未マウントの日へのsetValueになる。全体useWatchの出力は未マウント（未登録）の
        // フィールド配列の更新を取りこぼすことがあり目次に反映されないが、getValues()は
        // 内部の全フォーム値を返すので、全日程の最新状態を確実に取得できる。
        const metadataValues = convertToMetadataFormat(
          getValues() as SyncedFormValues,
        );
        setAtomValue(metadataValues as ItineraryMetadata);
      }, 300);
    }
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [formValues, setAtomValue, getValues]);

  // 初期データがある場合は、初回のみJotaiの状態を初期化する。
  // 編集ページはServer Componentで、?day= の変更（日の切り替え）ごとに再実行され
  // getItineraryById()から新しいinitialData参照が渡ってくる。これを毎回atomへ適用すると
  // 未保存の編集（前日/翌日への移動など）がサーバーの元データで上書きされ、目次が
  // 巻き戻ってしまう。初期化は一度だけにし、以降はライブのフォーム値からの同期に任せる。
  // （別の旅程を開く場合はルートセグメントが変わり本フックが再マウントされるため安全）
  useEffect(() => {
    if (initialData && !didInitRef.current) {
      didInitRef.current = true;
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
