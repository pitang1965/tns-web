import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Edit,
  Plus,
  Save,
  Trash,
  ArrowLeft,
  Check,
  Share2,
} from 'lucide-react';
import { formatDateWithWeekday } from '@/lib/date';

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
  // Twitter共有用のプロパティを修正
  shareData?: {
    title: string;
    dayIndex: number;
    date?: string;
    id?: string;
  };
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
}: FixedActionButtonsProps) {
  // X(Twitter)共有機能
  const handleShareToTwitter = () => {
    if (!shareData || !shareData.id) return;

    const { title, dayIndex, date, id } = shareData;

    // 日付をフォーマット（dateがundefinedの場合は空文字列を使用）
    const formattedDate = date ? formatDateWithWeekday(date) : '';

    // ツイート内容の作成
    const tweetText = encodeURIComponent(
      `${title} ${
        dayIndex + 1
      }日目: ${formattedDate}の旅程です。\nhttps://tabi.over40web.club/itineraries/${id}?day=${
        dayIndex + 1
      }`
    );

    // X(Twitter)共有URLを作成
    const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;

    // 新しいウィンドウでTwitter共有画面を開く
    window.open(twitterUrl, '_blank', 'width=550,height=420');
  };

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
          {/* X(Twitter)共有ボタン - 詳細モードでのみ表示 */}
          {shareData && shareData.id && (
            <Button
              onClick={handleShareToTwitter}
              size='icon'
              variant='secondary'
              className='rounded-full shadow-lg bg-blue-500 hover:bg-blue-600 text-white'
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
