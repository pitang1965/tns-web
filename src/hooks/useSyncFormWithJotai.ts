import { useEffect } from 'react';
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
  initialData?: any // 初期データ（オプション）
) {
  // Jotaiの状態を取得（更新用）
  const [, setAtomValue] = useAtom(atomToSync);

  // react-hook-formのwatchを使用してフォームの値の変更を監視
  const formValues = useWatch({
    control: formMethods.control,
  });

  // フォームの値が変更されたらJotaiの状態を更新
  useEffect(() => {
    if (formValues) {
      setAtomValue(formValues);
    }
  }, [formValues, setAtomValue]);

  // 初期データがある場合は、初回レンダリング時にJotaiの状態も初期化
  useEffect(() => {
    if (initialData) {
      setAtomValue(initialData);
    }
  }, [initialData, setAtomValue]);

  return {
    syncedValues: formValues,
  };
}
