'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Menu } from 'lucide-react';

type SortableActivityListItemProps = {
  id: string;
  index: number;
  title: string;
};

export function SortableActivityListItem({
  id,
  index,
  title,
}: SortableActivityListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 px-2 py-1.5 bg-card border border-border rounded hover:bg-accent/50 transition-colors ${
        isDragging ? 'opacity-40 shadow-lg ring-2 ring-primary' : ''
      }`}
    >
      {/* ドラッグハンドル */}
      <button
        type='button'
        {...attributes}
        {...listeners}
        className='cursor-grab active:cursor-grabbing flex-shrink-0 p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors'
        title='ドラッグして並び替え'
      >
        <Menu className='h-4 w-4' />
      </button>

      {/* アクティビティ情報 */}
      <div className='flex-1 min-w-0 flex items-center gap-1.5'>
        <span className='text-xs font-medium text-muted-foreground w-6 text-right flex-shrink-0'>
          {index + 1}.
        </span>
        <span className='text-sm truncate'>{title || '（タイトル未設定）'}</span>
      </div>
    </div>
  );
}
