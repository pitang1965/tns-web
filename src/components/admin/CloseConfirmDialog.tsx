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

type CloseConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

/**
 * フォームを閉じる際の確認ダイアログコンポーネント
 */
export function CloseConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
}: CloseConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>入力内容を破棄しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            入力した内容が保存されていません。このまま戻ると入力内容が失われます。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>入力を続ける</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className='bg-red-600 hover:bg-red-700'
          >
            破棄して戻る
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
