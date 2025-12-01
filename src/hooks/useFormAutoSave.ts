import { useEffect } from 'react';
import { UseFormWatch, UseFormReset, UseFormSetValue } from 'react-hook-form';
import { ShachuHakuFormData } from '@/components/admin/validationSchemas';
import { AUTO_SAVE_KEY, DEFAULT_FORM_VALUES } from '@/constants/formDefaults';
import { hasFormInput } from '@/lib/utils/spotFormUtils';

type UseFormAutoSaveProps = {
  watch: UseFormWatch<ShachuHakuFormData>;
  reset: UseFormReset<ShachuHakuFormData>;
  setValue: UseFormSetValue<ShachuHakuFormData>;
  isEdit: boolean;
  toast: (props: { title: string; description: string }) => void;
};

/**
 * フォームの自動保存・復元機能を提供するカスタムフック
 */
export function useFormAutoSave({
  watch,
  reset,
  setValue,
  isEdit,
  toast,
}: UseFormAutoSaveProps): {
  clearStorage: () => void;
  checkHasFormInput: () => boolean;
  resetToDefault: () => void;
} {
  // LocalStorageからの復元ロジック（初回マウント時のみ）
  useEffect(() => {
    // 編集モードでは復元しない
    if (isEdit) return;

    try {
      const savedData = localStorage.getItem(AUTO_SAVE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);

        // データが有効な場合は復元
        reset(parsedData);

        // 復元後に明示的にSelectフィールドの値を設定
        setTimeout(() => {
          if (parsedData.type !== undefined) {
            setValue('type', parsedData.type, { shouldValidate: true });
          }
          if (parsedData.prefecture) {
            setValue('prefecture', parsedData.prefecture, {
              shouldValidate: true,
            });
          }
        }, 0);

        toast({
          title: '下書きを復元しました',
          description: '前回入力していたデータを復元しました。',
        });
      }
    } catch (error) {
      console.error('Failed to restore form data from localStorage:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 初回マウント時のみ実行

  // フォームの値が変更されたときに自動保存（新規作成モードのみ）
  useEffect(() => {
    if (!isEdit) {
      const subscription = watch((formData) => {
        try {
          // フォームデータをLocalStorageに保存
          localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(formData));
        } catch (error) {
          console.error('Failed to save form data to localStorage:', error);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, [watch, isEdit]);

  /**
   * LocalStorageから下書きデータをクリア
   */
  const clearStorage = () => {
    localStorage.removeItem(AUTO_SAVE_KEY);
  };

  /**
   * フォームに入力があるかチェック
   */
  const checkHasFormInput = () => {
    const formValues = watch();
    return hasFormInput(formValues);
  };

  /**
   * フォームをデフォルト値にリセット
   */
  const resetToDefault = () => {
    reset(DEFAULT_FORM_VALUES);
  };

  return {
    clearStorage,
    checkHasFormInput,
    resetToDefault,
  };
}
