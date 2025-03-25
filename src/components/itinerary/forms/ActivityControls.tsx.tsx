'use client';

import { useState } from 'react';
import { TimeShiftDialog } from '@/components/itinerary/forms/TimeShiftDialog';
import { Button } from '@/components/ui/button';
import { MoveUp, MoveDown, Trash2, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type ActivityControlsProps = {
  dayIndex: number;
  activityIndex: number;
  remove: (dayIndex: number, activityIndex: number) => void;
  moveActivity?: (dayIndex: number, fromIndex: number, toIndex: number) => void;
  isFirst?: boolean;
  isLast?: boolean;
  onShiftSubsequentActivities?: (
    dayIndex: number,
    activityIndex: number,
    minutes: number
  ) => void;
};

export function ActivityControls({
  dayIndex,
  activityIndex,
  remove,
  moveActivity,
  isFirst = false,
  isLast = false,
  onShiftSubsequentActivities,
}: ActivityControlsProps) {
  const [isTimeShiftDialogOpen, setIsTimeShiftDialogOpen] = useState(false);

  const handleShiftSubsequentActivities = () => {
    console.log('Dialog open triggered'); // デバッグログ
    setIsTimeShiftDialogOpen(true);
  };

  const handleTimeShiftConfirm = (minutes: number) => {
    if (onShiftSubsequentActivities) {
      onShiftSubsequentActivities(dayIndex, activityIndex, minutes);
    }
  };

  return (
    <>
      <div className='flex gap-1'>
        {moveActivity && !isFirst && (
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={() =>
              moveActivity(dayIndex, activityIndex, activityIndex - 1)
            }
            title='上に移動'
          >
            <MoveUp className='h-4 w-4' />
          </Button>
        )}
        {moveActivity && !isLast && (
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={() =>
              moveActivity(dayIndex, activityIndex, activityIndex + 1)
            }
            title='下に移動'
          >
            <MoveDown className='h-4 w-4' />
          </Button>
        )}
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={() => remove(dayIndex, activityIndex)}
          title='削除'
        >
          <Trash2 className='h-4 w-4' />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              title='その他のオプション'
            >
              <MoreVertical className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem onClick={handleShiftSubsequentActivities}>
              以降のアクティビティの時間をずらす
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <TimeShiftDialog
        open={isTimeShiftDialogOpen}
        onOpenChange={setIsTimeShiftDialogOpen}
        onConfirm={handleTimeShiftConfirm}
        dayIndex={dayIndex}
        activityIndex={activityIndex}
      />
    </>
  );
}
