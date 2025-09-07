import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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

  // 共有ボタンが無効かどうかを判定
  const isShareDisabled = disabled || (shareData && shareData.isPublic === false);

  return (
    <div className='fixed top-16 right-4 flex gap-2 z-50'>
      {/* 共通: 戻るボタン（詳細・編集・新規作成のすべてで利用可能） */}
      {onBack && (
        <Tooltip>
          <TooltipTrigger
            onClick={(e) => onBack(e)}
            disabled={disabled}
            className='inline-flex items-center justify-center rounded-full h-10 w-10 shadow-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground'
          >
            <ArrowLeft className='h-5 w-5' />
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>戻る</p>
          </TooltipContent>
        </Tooltip>
      )}

      {/* 詳細モード */}
      {mode === 'detail' && (
        <>
          {/* 共有ボタン - 詳細モードでのみ表示 */}
          {shareData && shareData.id && (
            <Tooltip>
              <TooltipTrigger
                onClick={onShare}
                disabled={isShareDisabled}
                className={`inline-flex items-center justify-center rounded-full h-10 w-10 shadow-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground ${isShareDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Share2 className='h-5 w-5' />
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{shareData.isPublic === false ? '公開設定を有効にしてください' : '旅程を共有'}</p>
              </TooltipContent>
            </Tooltip>
          )}

          {onEdit && (
            <Tooltip>
              <TooltipTrigger
                onClick={onEdit}
                disabled={disabled}
                className='inline-flex items-center justify-center rounded-full h-10 w-10 shadow-lg bg-secondary hover:bg-secondary/80'
              >
                <Edit className='h-5 w-5' />
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>編集</p>
              </TooltipContent>
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip>
              <TooltipTrigger
                onClick={onDelete}
                disabled={disabled}
                className='inline-flex items-center justify-center rounded-full h-10 w-10 shadow-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground'
              >
                <Trash className='h-5 w-5' />
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>削除</p>
              </TooltipContent>
            </Tooltip>
          )}
          {onAdd && (
            <Tooltip>
              <TooltipTrigger
                onClick={onAdd}
                disabled={disabled}
                className='inline-flex items-center justify-center rounded-full h-10 w-10 shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground'
              >
                <Plus className='h-5 w-5' />
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>追加</p>
              </TooltipContent>
            </Tooltip>
          )}
        </>
      )}

      {/* 編集モード */}
      {mode === 'edit' && (
        <>
          {onDelete && (
            <Tooltip>
              <TooltipTrigger
                onClick={onDelete}
                disabled={disabled}
                className='inline-flex items-center justify-center rounded-full h-10 w-10 shadow-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground'
              >
                <Trash className='h-5 w-5' />
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>削除</p>
              </TooltipContent>
            </Tooltip>
          )}
          {onSave && (
            <Tooltip>
              <TooltipTrigger
                onClick={(e) => onSave(e)}
                disabled={disabled}
                className='inline-flex items-center justify-center rounded-full h-10 w-10 shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground'
              >
                <Save className='h-5 w-5' />
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>保存</p>
              </TooltipContent>
            </Tooltip>
          )}
        </>
      )}

      {/* 新規作成モード */}
      {mode === 'create' && (
        <>
          {onCreate && (
            <Tooltip>
              <TooltipTrigger
                onClick={(e) => onCreate(e)}
                disabled={disabled}
                className='inline-flex items-center justify-center rounded-full h-10 w-10 shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground'
              >
                <BookPlus className='h-5 w-5' />
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>作成</p>
              </TooltipContent>
            </Tooltip>
          )}
        </>
      )}

      {/* カスタムボタン */}
      {customButtons}
    </div>
  );
}
