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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

type DeleteConfirmationDialogProps = {
  itineraryId: string;
  deleteItinerary: (id: string) => Promise<{ success: boolean; message?: string }>;
  onSuccess?: () => void;
}

export function DeleteConfirmationDialog({
  itineraryId,
  deleteItinerary,
  onSuccess,
}:DeleteConfirmationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteItinerary(itineraryId);

      if (result.success) {
        setIsOpen(false);
        // コールバックで成功を通知
        onSuccess?.();
      } else {
        alert(result.message || '旅程の削除中にエラーが発生しました。');
      }
    } catch (error) {
      console.error('Error deleting itinerary:', error);
      alert('旅程の削除中にエラーが発生しました。');
    }
    setIsDeleting(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant='destructive' size='sm'>
          削除
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>旅程の削除</AlertDialogTitle>
          <AlertDialogDescription>
            本当にこの旅程を削除しますか？この操作は取り消せません。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            キャンセル
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
          >
            {isDeleting ? '削除中...' : '削除'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
