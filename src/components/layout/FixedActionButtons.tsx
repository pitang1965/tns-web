import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Plus, Save, Trash, ArrowLeft, Check } from 'lucide-react';

export type FixedActionButtonsProps = {
  mode?: 'detail' | 'edit' | 'create';
  onEdit?: () => void;
  onSave?: () => void;
  onBack?: () => void;
  onDelete?: () => void;
  onAdd?: () => void;
  onCreate?: () => void;
  customButtons?: React.ReactNode;
  disabled?: boolean;
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
}: FixedActionButtonsProps) {
  return (
    <div className='fixed top-16 right-4 flex gap-2 z-50'>
      {/* 共通: 戻るボタン（詳細・編集・新規作成のすべてで利用可能） */}
      {onBack && (
        <Button
          onClick={onBack}
          size='icon'
          variant='outline'
          className='rounded-full shadow-lg'
        >
          <ArrowLeft className='h-5 w-5' />
        </Button>
      )}

      {/* 詳細モード */}
      {mode === 'detail' && (
        <>
          {onEdit && (
            <Button
              onClick={onEdit}
              size='icon'
              variant='secondary'
              className='rounded-full shadow-lg'
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
            >
              <Trash className='h-5 w-5' />
            </Button>
          )}
          {onSave && (
            <Button
              onClick={onSave}
              size='icon'
              variant='default'
              className='rounded-full shadow-lg'
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
              onClick={onCreate}
              size='icon'
              variant='default'
              className='rounded-full shadow-lg'
            >
              <Check className='h-5 w-5' />
            </Button>
          )}
        </>
      )}

      {/* カスタムボタン */}
      {customButtons}
    </div>
  );
}
