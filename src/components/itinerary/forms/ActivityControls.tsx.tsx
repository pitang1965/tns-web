'use client';

import { useState } from 'react';
import { TimeShiftDialog } from '@/components/itinerary/forms/TimeShiftDialog';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { MoveUp, MoveDown, Trash2, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';

type ActivityControlsProps = {
  dayIndex: number;
  activityIndex: number;
  remove: (dayIndex: number, activityIndex: number) => void;
  moveActivity?: (dayIndex: number, fromIndex: number, toIndex: number) => void;
  insertActivity?: (dayIndex: number, atIndex: number) => void;
  moveToPreviousDay?: (dayIndex: number, activityIndex: number) => void;
  moveToNextDay?: (dayIndex: number, activityIndex: number) => void;
  isFirst?: boolean;
  isLast?: boolean;
  isPreviousDayAvailable?: boolean;
  isNextDayAvailable?: boolean;
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
  insertActivity,
  moveToPreviousDay,
  moveToNextDay,
  isFirst = false,
  isLast = false,
  isPreviousDayAvailable = false,
  isNextDayAvailable = false,
  onShiftSubsequentActivities,
}: ActivityControlsProps) {
  const [isTimeShiftDialogOpen, setIsTimeShiftDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isPrevDayConfirmOpen, setIsPrevDayConfirmOpen] = useState(false);
  const [isNextDayConfirmOpen, setIsNextDayConfirmOpen] = useState(false);

  const handleShiftSubsequentActivities = () => {
    setIsTimeShiftDialogOpen(true);
  };

  const handleTimeShiftConfirm = (
    dayIndex: number,
    activityIndex: number,
    delayMinutes: number
  ) => {
    if (onShiftSubsequentActivities) {
      onShiftSubsequentActivities(dayIndex, activityIndex, delayMinutes);
    }
  };

  const handleDelete = async () => remove(dayIndex, activityIndex);

  const handleMoveToPreviousDay = async () => {
    if (moveToPreviousDay) {
      moveToPreviousDay(dayIndex, activityIndex);
    }
    setIsPrevDayConfirmOpen(false);
  };

  const handleMoveToNextDay = async () => {
    if (moveToNextDay) {
      moveToNextDay(dayIndex, activityIndex);
    }
    setIsNextDayConfirmOpen(false);
  };

  return (
    <>
      <ButtonGroup>
        {moveActivity && !isFirst && (
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() =>
              moveActivity(dayIndex, activityIndex, activityIndex - 1)
            }
            title='上に移動'
            className='cursor-pointer'
          >
            <MoveUp className='h-4 w-4' />
          </Button>
        )}
        {moveActivity && !isLast && (
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() =>
              moveActivity(dayIndex, activityIndex, activityIndex + 1)
            }
            title='下に移動'
            className='cursor-pointer'
          >
            <MoveDown className='h-4 w-4' />
          </Button>
        )}
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() => setIsDeleteConfirmOpen(true)}
          title='削除'
          className='cursor-pointer'
        >
          <Trash2 className='h-4 w-4' />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type='button'
              variant='outline'
              size='sm'
              title='その他のオプション'
              className='cursor-pointer'
            >
              <MoreVertical className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            {insertActivity && (
              <DropdownMenuItem onClick={() => insertActivity(dayIndex, activityIndex)} className='cursor-pointer'>
                上にアクティビティを追加
              </DropdownMenuItem>
            )}
            {insertActivity && (
              <DropdownMenuItem onClick={() => insertActivity(dayIndex, activityIndex + 1)} className='cursor-pointer'>
                下にアクティビティを追加
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleShiftSubsequentActivities} className='cursor-pointer'>
              以降のアクティビティの時間をずらす
            </DropdownMenuItem>
            {isPreviousDayAvailable && (
              <DropdownMenuItem onClick={() => setIsPrevDayConfirmOpen(true)} className='cursor-pointer'>
                前日の末尾に移動
              </DropdownMenuItem>
            )}
            {isNextDayAvailable && (
              <DropdownMenuItem onClick={() => setIsNextDayConfirmOpen(true)} className='cursor-pointer'>
                翌日の先頭に移動
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </ButtonGroup>
      <TimeShiftDialog
        open={isTimeShiftDialogOpen}
        onOpenChange={setIsTimeShiftDialogOpen}
        onConfirm={handleTimeShiftConfirm}
        dayIndex={dayIndex}
        activityIndex={activityIndex}
      />
      <ConfirmationDialog
        isOpen={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title='アクティビティの削除'
        description='このアクティビィティを削除してもよろしいですか？'
        confirmLabel='削除'
        onConfirm={handleDelete}
        variant='destructive'
      />
      <ConfirmationDialog
        isOpen={isPrevDayConfirmOpen}
        onOpenChange={setIsPrevDayConfirmOpen}
        title='前日に移動'
        description='このアクティビティを前日に移動しますか？前日の末尾に追加され、時刻情報はクリアされます。'
        confirmLabel='移動'
        onConfirm={handleMoveToPreviousDay}
      />
      <ConfirmationDialog
        isOpen={isNextDayConfirmOpen}
        onOpenChange={setIsNextDayConfirmOpen}
        title='翌日に移動'
        description='このアクティビティを翌日に移動しますか？翌日の先頭に追加され、時刻情報はクリアされます。'
        confirmLabel='移動'
        onConfirm={handleMoveToNextDay}
      />
    </>
  );
}
