import { useState } from 'react';
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
import { cn } from '@/lib/utils';
import { Trash2, Loader2 } from 'lucide-react';

type ConfirmationDialogProps = {
  // ダイアログの表示/非表示を制御
  isOpen: boolean;

  // ダイアログの表示状態が変更された時に呼ばれる関数
  // 引数のopenは新しい表示状態（true/false）
  onOpenChange: (open: boolean) => void;

  // ダイアログのタイトル（例：「旅程の削除」）
  title: string;

  // ダイアログの説明文（例：「本当にこの旅程を削除しますか？この操作は取り消せません。」)
  description: string;

  // 確認ボタンのラベル（例：「削除」。処理中は「削除中...」と表示）
  confirmLabel: string;

  // キャンセルボタンのラベル（省略時は、「キャンセル」）
  cancelLabel?: string;

  // 確認ボタンがクリックされた時に実行される非同期関数
  onConfirm: () => Promise<void>;

  // ダイアログのスタイルバリアント
  // ?は省略可能で、'default'か'destructive'のいずれかの値を取る
  variant?: 'default' | 'destructive';
};

export function ConfirmationDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = 'キャンセル',
  onConfirm,
  variant = 'default',
}: ConfirmationDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error('Confirmation action failed:', error);
      alert('操作に失敗しました。しばらく時間をおいて再度お試しください。');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing} className="cursor-pointer">
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isProcessing}
            className={cn(
              'cursor-pointer',
              variant === 'destructive' &&
                'bg-destructive text-destructive-foreground hover:bg-destructive/90'
            )}
          >
            {isProcessing ? (
              <>
                <Loader2 className='w-4 h-4 mr-1 animate-spin' />
                {confirmLabel}中...
              </>
            ) : (
              <>
                {variant === 'destructive' && <Trash2 className='w-4 h-4 mr-1' />}
                {confirmLabel}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
