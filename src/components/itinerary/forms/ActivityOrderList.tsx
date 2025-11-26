'use client';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableActivityListItem } from './SortableActivityListItem';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

type Activity = {
  id: string;
  title: string;
};

type ActivityOrderListProps = {
  activities: Activity[];
  onReorder: (oldIndex: number, newIndex: number) => void;
  onAdd?: () => void;
};

export function ActivityOrderList({
  activities,
  onReorder,
  onAdd,
}: ActivityOrderListProps) {
  const sensors = useSensors(
    useSensor(MouseSensor, {
      // マウスの場合は10px移動で開始
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      // タッチの場合は250ms遅延、5pxの許容範囲でスクロールと競合しないようにする
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = activities.findIndex(
      (activity) => activity.id === active.id
    );
    const newIndex = activities.findIndex(
      (activity) => activity.id === over.id
    );

    if (oldIndex !== -1 && newIndex !== -1) {
      onReorder(oldIndex, newIndex);
    }
  };

  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between'>
        <h4 className='text-sm font-medium'>並び順</h4>
        <span className='text-xs text-muted-foreground'>
          ドラッグで並び替え
        </span>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={activities.map((activity) => activity.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className='space-y-2'>
            {activities.map((activity, index) => (
              <SortableActivityListItem
                key={activity.id}
                id={activity.id}
                index={index}
                title={activity.title}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {onAdd && (
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={onAdd}
          className='w-full cursor-pointer text-xs h-8'
        >
          <PlusCircle className='h-3.5 w-3.5 mr-1.5' />
          追加
        </Button>
      )}
    </div>
  );
}
