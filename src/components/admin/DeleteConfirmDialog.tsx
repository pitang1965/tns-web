'use client';
// 削除確認ダイアログ
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CampingSpotWithId } from '@/data/schemas/campingSpot';

type DeleteConfirmDialogProps = {
  spot?: CampingSpotWithId | null;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmDialog({
  spot,
  loading,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60'>
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle className='text-red-600'>削除確認</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='mb-4'>
            「{spot?.name}」を削除しますか？この操作は取り消せません。
          </p>
          <div className='flex justify-end gap-2'>
            <Button variant='outline' onClick={onCancel} disabled={loading} className='cursor-pointer'>
              キャンセル
            </Button>
            <Button
              variant='destructive'
              onClick={onConfirm}
              disabled={loading}
              className='cursor-pointer'
            >
              削除
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
