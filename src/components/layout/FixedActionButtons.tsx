import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Edit,
  Plus,
  Save,
  Trash,
  ArrowLeft,
  Share2,
  BookPlus,
} from 'lucide-react';
import { handleShare, type ShareData } from '@/lib/shareUtils';

export type FixedActionButtonsProps = {
  mode?: 'detail' | 'edit' | 'create';
  onEdit?: () => void;
  onSave?: (e: React.MouseEvent) => void;
  onBack?: (e: React.MouseEvent) => void;
  onDelete?: () => void;
  onAdd?: () => void;
  onCreate?: (e: React.MouseEvent) => void;
  customButtons?: React.ReactNode;
  disabled?: boolean;
  // 共有用のプロパティ
  shareData?: ShareData;
};

export function FixedActionButtons({
  mode = 'detail',
  onEdit,
  onSave,
  onDelete,
  onAdd,
  onBack,
  onCreate,
  customButtons,
  shareData,
  disabled = false,
}: FixedActionButtonsProps) {
  // 共有機能
  const onShare = () => {
    if (shareData) {
      handleShare(shareData);
    }
  };

  return (
    <div className='fixed top-16 right-4 flex gap-2 z-50'>
      {/* 共通: 戻るボタン（詳細・編集・新規作成のすべてで利用可能） */}
      {onBack && (
        <Button
          onClick={(e) => onBack(e)}
          size='icon'
          variant='outline'
          className='rounded-full shadow-lg'
          disabled={disabled}
          type='button' // 明示的にbuttonタイプを指定
        >
          <ArrowLeft className='h-5 w-5' />
        </Button>
      )}

      {/* 詳細モード */}
      {mode === 'detail' && (
        <>
          {/* 共有ボタン - 詳細モードでのみ表示 */}
          {shareData && shareData.id && (
            <Button
              onClick={onShare}
              size='icon'
              variant='secondary'
              className='rounded-full shadow-lg'
              disabled={disabled}
              type='button'
            >
              <Share2 className='h-5 w-5' />
            </Button>
          )}

          {onEdit && (
            <Button
              onClick={onEdit}
              size='icon'
              variant='secondary'
              className='rounded-full shadow-lg'
              disabled={disabled}
              type='button'
            >
              <Edit className='h-5 w-5' />
            </Button>
          )}
          {onDelete && (
            <Button
              onClick={onDelete}
              size='icon'
              variant='destructive'
              className='rounded-full shadow-lg'
              disabled={disabled}
              type='button'
            >
              <Trash className='h-5 w-5' />
            </Button>
          )}
          {onAdd && (
            <Button
              onClick={onAdd}
              size='icon'
              variant='default'
              className='rounded-full shadow-lg'
              disabled={disabled}
              type='button'
            >
              <Plus className='h-5 w-5' />
            </Button>
          )}
        </>
      )}

      {/* 編集モード */}
      {mode === 'edit' && (
        <>
          {onDelete && (
            <Button
              onClick={onDelete}
              size='icon'
              variant='destructive'
              className='rounded-full shadow-lg'
              disabled={disabled}
              type='button'
            >
              <Trash className='h-5 w-5' />
            </Button>
          )}
          {onSave && (
            <Button
              onClick={(e) => onSave(e)}
              size='icon'
              variant='default'
              className='rounded-full shadow-lg'
              disabled={disabled}
              type='button'
            >
              <Save className='h-5 w-5' />
            </Button>
          )}
        </>
      )}

      {/* 新規作成モード */}
      {mode === 'create' && (
        <>
          {onCreate && (
            <Button
              onClick={(e) => onCreate(e)}
              size='icon'
              variant='default'
              className='rounded-full shadow-lg'
              disabled={disabled}
              type='button'
            >
              <BookPlus className='h-5 w-5' />
            </Button>
          )}
        </>
      )}

      {/* カスタムボタン */}
      {customButtons}
    </div>
  );
}
