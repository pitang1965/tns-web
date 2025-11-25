'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MissingFields } from '@/hooks/useCheckMissingFields';

type MissingFieldsConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  missingFields: MissingFields;
  loading: boolean;
  onConfirm: () => void;
  isEdit?: boolean;
};

/**
 * 未入力項目の確認ダイアログコンポーネント
 */
export function MissingFieldsConfirmDialog({
  open,
  onOpenChange,
  missingFields,
  loading,
  onConfirm,
  isEdit = false,
}: MissingFieldsConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
        <AlertDialogHeader>
          <AlertDialogTitle>未入力項目の確認</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className='space-y-4 text-left'>
              <p className='text-sm text-gray-700 dark:text-gray-300'>
                以下の項目が入力されていませんが、このまま{isEdit ? '更新' : '作成'}しますか？
              </p>

              {missingFields.empty.length > 0 && (
                <div className='space-y-2'>
                  <p className='font-medium text-sm text-gray-900 dark:text-gray-100'>
                    以下が入力されていません:
                  </p>
                  <ul className='list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300'>
                    {missingFields.empty.map((field, index) => (
                      <li key={index}>{field}</li>
                    ))}
                  </ul>
                </div>
              )}

              {missingFields.unchecked.length > 0 && (
                <div className='space-y-2'>
                  <p className='font-medium text-sm text-gray-900 dark:text-gray-100'>
                    次で大丈夫ですか？
                  </p>
                  <ul className='list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300'>
                    {missingFields.unchecked.map((field, index) => (
                      <li key={index}>{field}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            戻って入力する
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? '保存中...' : `このまま${isEdit ? '更新' : '作成'}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
