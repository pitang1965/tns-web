import { useEffect, useRef, useCallback } from 'react';
import { UseFormWatch, UseFormReset, UseFormSetValue } from 'react-hook-form';
import { ShachuHakuFormInput } from '@/components/admin/validationSchemas';
import { AUTO_SAVE_KEY, DEFAULT_FORM_VALUES } from '@/constants/formDefaults';
import { hasFormInput } from '@/lib/utils/spotFormUtils';

type UseFormAutoSaveProps = {
  watch: UseFormWatch<ShachuHakuFormInput>;
  reset: UseFormReset<ShachuHakuFormInput>;
  setValue: UseFormSetValue<ShachuHakuFormInput>;
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
  const hasRestoredRef = useRef(false);

  // LocalStorageからの復元ロジック（初回マウント時のみ）
  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;

    if (isEdit) return;

    try {
      const savedData = localStorage.getItem(AUTO_SAVE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);

        reset(parsedData);

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
  }, [isEdit, reset, setValue, toast]);

  // フォームの値が変更されたときに自動保存（新規作成モードのみ）
  useEffect(() => {
    if (!isEdit) {
      let timeoutId: NodeJS.Timeout | null = null;

      const subscription = watch((formData) => {
        // 既存のタイマーをクリア
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        // 500ms後に保存（debounce）
        timeoutId = setTimeout(() => {
          try {
            // フォームデータをLocalStorageに保存
            localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(formData));
          } catch (error) {
            console.error('Failed to save form data to localStorage:', error);
          }
        }, 500);
      });

      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        subscription.unsubscribe();
      };
    }
  }, [watch, isEdit]);

  const clearStorage = useCallback(() => {
    localStorage.removeItem(AUTO_SAVE_KEY);
  }, []);

  const checkHasFormInput = useCallback(() => {
    const formValues = watch();
    return hasFormInput(formValues);
  }, [watch]);

  const resetToDefault = useCallback(() => {
    reset(DEFAULT_FORM_VALUES);
  }, [reset]);

  return {
    clearStorage,
    checkHasFormInput,
    resetToDefault,
  };
}
