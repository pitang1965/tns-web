'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useForm } from 'react-hook-form';

type TimeShiftDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (minutes: number) => void;
  dayIndex: number;
  activityIndex: number;
};

export function TimeShiftDialog({
  open,
  onOpenChange,
  onConfirm,
  dayIndex,
  activityIndex,
}: TimeShiftDialogProps) {
  const form = useForm({
    defaultValues: {
      direction: 'add',
      minutes: '15',
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    const minutes = parseInt(data.minutes, 10);
    const finalMinutes = data.direction === 'subtract' ? -minutes : minutes;
    onConfirm(finalMinutes);
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>以降のアクティビティの時間をずらす</DialogTitle>
          <DialogDescription>
            このアクティビティ以降の全ての時間を調整します。
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField
              control={form.control}
              name="direction"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>時間の調整方向</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="add" id="add" />
                        <label htmlFor="add" className="cursor-pointer">時間を後ろにずらす（遅くする）</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="subtract" id="subtract" />
                        <label htmlFor="subtract" className="cursor-pointer">時間を前にずらす（早くする）</label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>分数</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder="15"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                キャンセル
              </Button>
              <Button type="submit">適用</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}