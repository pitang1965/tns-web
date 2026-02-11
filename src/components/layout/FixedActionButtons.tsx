import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Pencil,
  Plus,
  Save,
  Trash2,
  ArrowLeft,
  Share2,
  BookPlus,
  Loader2,
} from 'lucide-react';
import {
  handleItineraryShare,
  type ShareItineraryData,
} from '@/lib/shareUtils';

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
  // 共有用のプロパティ（旅程用）
  shareItineraryData?: ShareItineraryData;
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
  shareItineraryData,
  disabled = false,
}: FixedActionButtonsProps) {
  // 共有機能
  const onShare = () => {
    if (shareItineraryData) {
      handleItineraryShare(shareItineraryData);
    }
  };

  // 共有ボタンが無効かどうかを判定
  const isShareDisabled =
    disabled || (shareItineraryData && shareItineraryData.isPublic === false);

  return (
    <TooltipProvider>
    <div className='fixed top-16 right-4 flex gap-2 z-50'>
      {/* 共通: 戻るボタン（詳細・編集・新規作成のすべてで利用可能） */}
      {onBack && (
        <Tooltip>
          <TooltipTrigger
            onClick={(e) => onBack(e)}
            disabled={disabled}
            aria-label="戻る"
            className='inline-flex items-center justify-center rounded-full h-10 w-10 shadow-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer active:scale-95 transition-transform'
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
          {shareItineraryData && shareItineraryData.id && (
            <Tooltip>
              <TooltipTrigger
                onClick={onShare}
                disabled={isShareDisabled}
                aria-label="旅程を共有"
                className={`inline-flex items-center justify-center rounded-full h-10 w-10 shadow-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-transform ${isShareDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
              >
                <Share2 className='h-5 w-5' />
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>
                  {shareItineraryData.isPublic === false
                    ? '公開設定を有効にしてください'
                    : '旅程を共有'}
                </p>
              </TooltipContent>
            </Tooltip>
          )}

          {onEdit && (
            <Tooltip>
              <TooltipTrigger
                onClick={onEdit}
                disabled={disabled}
                aria-label="編集"
                className='inline-flex items-center justify-center rounded-full h-10 w-10 shadow-lg bg-secondary hover:bg-secondary/80 cursor-pointer active:scale-95 transition-transform'
              >
                <Pencil className='h-5 w-5' />
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
                aria-label="削除"
                className='inline-flex items-center justify-center rounded-full h-10 w-10 shadow-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground cursor-pointer active:scale-95 transition-transform'
              >
                <Trash2 className='h-5 w-5' />
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
                aria-label="追加"
                className='inline-flex items-center justify-center rounded-full h-10 w-10 shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer active:scale-95 transition-transform'
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
                aria-label="削除"
                className='inline-flex items-center justify-center rounded-full h-10 w-10 shadow-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground cursor-pointer active:scale-95 transition-transform'
              >
                <Trash2 className='h-5 w-5' />
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
                aria-label={disabled ? '保存中' : '保存'}
                className={`inline-flex items-center justify-center rounded-full h-10 w-10 shadow-lg bg-primary text-primary-foreground transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/90 hover:scale-110 cursor-pointer'}`}
              >
                {disabled ? (
                  <Loader2 className='h-5 w-5 animate-spin' />
                ) : (
                  <Save className='h-5 w-5' />
                )}
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{disabled ? '保存中...' : '保存'}</p>
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
                aria-label={disabled ? '作成中' : '作成'}
                className={`inline-flex items-center justify-center rounded-full h-10 w-10 shadow-lg bg-primary text-primary-foreground transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/90 hover:scale-110 cursor-pointer'}`}
              >
                {disabled ? (
                  <Loader2 className='h-5 w-5 animate-spin' />
                ) : (
                  <BookPlus className='h-5 w-5' />
                )}
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{disabled ? '作成中...' : '作成'}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </>
      )}

      {/* カスタムボタン */}
      {customButtons}
    </div>
    </TooltipProvider>
  );
}
